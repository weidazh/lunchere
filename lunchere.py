"""
    This program standalone serves as a lunch selector.
    for each session (history_id), it preserves the history.
    user can confirm(yes) or cancel(no) a recommendation,
    or tell the system what hist_ev eat today.
"""
# from google.appengine.api import users
# from google.appengine.api import oauth
from google.appengine.ext import endpoints
from google.appengine.ext import db
from protorpc import remote
from protorpc import messages
import datetime


# endpoints: https://developers.google.com/appengine/docs/python/endpoints/
# protorpc:  https://developers.google.com/appengine/docs/python/tools/protorpc/

class HistoryIdMsg(messages.Message):
    "Used by RPC for cases where historyId or timeslot is unknown"
    historyId = messages.StringField(1, required=False)
    timeslot = messages.IntegerField(2, required=False)

class TodayRecommendation(messages.Message):
    "Return to client or confirm/cancel from client"
    name = messages.StringField(1, required=True)
    historyId = messages.StringField(2, required=True)
    timeslot = messages.IntegerField(3, required=False)
    confirmed = messages.BooleanField(4, required=False)
    timeslotFriendly = messages.StringField(5, required=False)


CLIENT_ID_ALL_JS      = '418397336121-13ej5mm6b5hef5n6qt87e2rj3u155f2l.apps.googleusercontent.com'

ALLOWED_CLIENT_IDS = [CLIENT_ID_ALL_JS, endpoints.API_EXPLORER_CLIENT_ID]


###### Auth Docs:
#  https://developers.google.com/appengine/docs/python/endpoints/auth
#  https://developers.google.com/appengine/docs/python/endpoints/create_api#allowed-clients-and-audiences
#  https://developers.google.com/appengine/docs/python/endpoints/consume_js#adding-oath-authentication
#  https://developers.google.com/api-client-library/python/guide/google_app_engine
def my_get_current_user(raise_unauth=True):
    """filter the endpoints.get_current_user, which could return None;
       in that case, raise exception which would trigger HTTP 401"""
    user = endpoints.get_current_user()
    if raise_unauth and user == None:
        raise endpoints.UnauthorizedException("Invalid token")
    return user

def require_login(func):
    "function decorator, prepend my_get_current_user"
    def wrapper(*args, **kargs):
        "wrap the original function with prepended my_get_current_user"
        my_get_current_user()
        return func(*args, **kargs)
    return wrapper

class Recommendation:
    "Intermediate class, actually I think it could be replaced with a tuple or so"
    def __init__(self, canteen_id, history_id, timeslot, confirmed):
        self.canteen_id = canteen_id
        self.history_id = history_id
        self.timeslot = timeslot
        self.confirmed = confirmed

    def to_rpc(self):
        """canteen_id if None, would be turn to \"\" because it is <required>
           timeslot_friendly is automatically rederred from timeslot;
           in future there could be many other such view that are rendered;
           such as is_last_meal, is_first_meal, etc"""
        if self.canteen_id is not None:
            canteen_id = self.canteen_id
        else:
            canteen_id = ""
        if self.timeslot is not None:
            timeslot_friendly = Timeslot.user_friendly(self.timeslot)
        else:
            timeslot_friendly = None
        return TodayRecommendation(name=canteen_id, historyId=self.history_id,
                                timeslot=self.timeslot, timeslotFriendly=timeslot_friendly,
                                confirmed=self.confirmed)

class HistoryEvent(db.Model):
    """A HistoryEvent is an record in History,
       all the records in the same History share the same History ID"""
    historyId = db.StringProperty(required=True)
    timeslot = db.IntegerProperty(required=True)
    event_date = db.DateTimeProperty(required=True)
    # 4 cases: initilized, confirmed, cancelled, confirmed and cancelled
    confirmed = db.BooleanProperty()
    cancelled = db.BooleanProperty()
    canteenId = db.StringProperty(required=True)

    @classmethod
    def get_max_timeslot(cls, history_id):
        """max timeslot of the specified history_id
           FIXME: it should return TODAY01 for the History.__init__ caller"""
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 ORDER BY timeslot DESC", history_id).get()
        return getattr(hist_ev, "timeslot", 2)

    @classmethod
    def get_prev_timeslot(cls, history_id, timeslot0):
        "max timeslot < timeslot0 of the specified history_id"
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot < :2 ORDER BY timeslot DESC", history_id, timeslot0).get()
        return getattr(hist_ev, "timeslot", None)

    @classmethod
    def get_next_timeslot(cls, history_id, timeslot0):
        "min timeslot > timeslot0 of the specified history_id"
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot > :2 ORDER BY timeslot ASC", history_id, timeslot0).get()
        return getattr(hist_ev, "timeslot", None)

    @classmethod
    def get_no_cancelled(cls, history_id, timeslot):
        """There should be at most one HistoryEvent that is not cancelled:
           the one I just recommend and not yet confirmed, or,
           the one that has been confirmed"""
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2 AND cancelled = False", history_id, timeslot).get()
        return hist_ev

    @classmethod
    def get_confirmed(cls, history_id, timeslot):
        """There should be at most one HistoryEvent that is confirmed and not cancelled"""
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2 AND " +
                        "confirmed = True AND cancelled = False", history_id, timeslot).get()
        return hist_ev

    @classmethod
    def get_canteen(cls, history_id, timeslot, canteen_id):
        "select the canteen by canteen_id"
        hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2 AND canteenId = :3",
                        history_id, timeslot, canteen_id).get()
        return hist_ev

class Choice(db.Model):
    historyId = db.StringProperty(required=True)
    canteenId = db.StringProperty(required=True)
    frequency = db.FloatProperty(required=True) # Initially each one has sum(frequency) / (n - 1)
    based_on = db.DateTimeProperty(required=True) # If None then 1970/1/1
    max_timeslot = db.IntegerProperty(required=True) # If None then 0

    @classmethod
    def _yield_choices(cls, choice_list, canteenIds, deffreq=None):
        for choice in choice_list.run():
            canteen_id = choice.canteenId
            if canteenIds.has_key(canteen_id):
                # already in choices, or excluded
                continue
            if hasattr(choice, "frequency"):
                freq = choice.frequency
            else:
                freq = deffreq
            yield canteen_id, freq, choice
            canteenIds[canteen_id] = True
    @classmethod
    def get_choices(cls, history_id, exclude=()):
        canteenIds = dict([(e, True) for e in exclude])
        choice_list = db.GqlQuery("SELECT * FROM Choice WHERE " +
                        "historyId = :1", history_id)
        choices = []
        max_timeslot = 0

        for (canteen_id, freq, choice) in Choice._yield_choices(choice_list, canteenIds):
            if choice.max_timeslot > max_timeslot:
                max_timeslot = choice.max_timeslot
            choices.append((canteen_id, freq))

        if len(choices):
            avg = sum([freq for canteen_id, freq in choices]) / len(choices)
        else:
            avg = 1.0

        choice_list = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot >= :2", history_id, max_timeslot)
        for (canteen_id, freq, hist_ev) in Choice._yield_choices(choice_list, canteenIds, deffreq=avg):
            choices.append((canteen_id, freq))
        return choices

    @classmethod
    def choose_from(cls, choices):
        _sum = sum([freq for canteen_id, freq in choices])
        import random
        r = random.random() * _sum
        for canteen_id, freq in choices:
            if freq >= r:
                return canteen_id
            r -= freq
        return canteen_id

class Hints(db.Model):
    historyId = db.StringProperty(required=True)
    hint_key = db.StringProperty(required=True)
    hint_value = db.StringProperty(required=False)

    @classmethod
    def get_hint(cls, history_id, key, def_value):
        hint = db.GqlQuery("SELECT * FROM Hints WHERE " +
                        "historyId = :1 AND key = :2", history_id, key)
        value = hint.get()
        if value is None:
            return def_value
        else:
            return value.hint_value

    @classmethod
    def set_hint(cls, history_id, key, value):
        hint = db.GqlQuery("SELECT * FROM Hints WHERE " +
                        "historyId = :1 AND key = :2", history_id, key)
        hint = hint.get()
        if hint is None:
            hint = Hints(historyId=history_id, hint_key=key, hint_value=value)
            hint.put()
        else:
            hint.hint_value = value
            hint.put()

class TZInfo(datetime.tzinfo):
    ZERO = datetime.timedelta(hours=0)
    def __init__(self, tzname):
        if tzname == "HKT":
            self._offset = datetime.timedelta(hours=8)
        else:
            raise Exception("Unknown timezone")
        self._tzname = tzname

    def tzname(self, _dt):
        return self._tzname

    def utcoffset(self, _dt):
        return self._offset + self.dst(_dt)

    def dst(self, _dt):
        "currently has no dst"
        return TZInfo.ZERO

class Timeslot:
    @classmethod
    def guess_local_timeslot(cls, history_id):
        tzinfo = TZInfo(Hints.get_hint(history_id, "timezone", "HKT"))
        utcnow = datetime.datetime.utcnow()
        localnow = tzinfo.fromutc(utcnow.replace(tzinfo=tzinfo))
        return localnow.year * 10000 + localnow.month * 100 + localnow.day

    @classmethod
    def ordinal(cls, num):
        "input num for number, output the suffix, e.g. st, nd, rd"
        if str(num).endswith("1") and not str(num).endswith("11"):
            return "st"
        elif str(num).endswith("2") and not str(num).endswith("12"):
            return "nd"
        elif str(num).endswith("3") and not str(num).endswith("13"):
            return "rd"
        else:
            return "th"

    @classmethod
    def user_friendly(cls, timeslot):
        "return user friendly English text for that timeslot"
        return "%d-%d-%d %d%s meal" % (timeslot / 1000000, timeslot / 10000 % 100, timeslot / 100 % 100, timeslot % 100, Timeslot.ordinal(timeslot % 100))

    @classmethod
    def prevmeal(cls, history_id, timeslot0):
        "find the previous timeslot < timeslot0"
        if timeslot0 is None:
            timeslot0 = HistoryEvent.get_max_timeslot(history_id)
        prev_timeslot = HistoryEvent.get_prev_timeslot(history_id, timeslot0)
        if prev_timeslot is None:
            return timeslot0
        else:
            return prev_timeslot

    @classmethod
    def nextmeal(cls, history_id, timeslot0):
        """find the next timeslot > timeslot0.
           create new timeslot only when current timeslot is confirmed, or,
           the day is changed"""
        if timeslot0 is None:
            timeslot0 = HistoryEvent.get_max_timeslot(history_id)
        else:
            exists_next_timeslot = HistoryEvent.get_next_timeslot(history_id, timeslot0)
            if exists_next_timeslot:
                return exists_next_timeslot # pivot to next timeslot

        base = Timeslot.guess_local_timeslot(history_id) * 100
        if timeslot0 >= base and HistoryEvent.get_confirmed(history_id, timeslot0):
            return timeslot0 + 1         # most recent timeslot, old date
        elif timeslot0 >= base:
            return timeslot0             # most recent timeslot but not confirmed
        else:
            return base + 1              # most recent timeslot and new date

class History:
    "A history is a sequence of guessings, recommendations, confirms and rejects/cancels"
    def _datastore_get_no_cancelled(self):
        hist_ev = HistoryEvent.get_no_cancelled(self.history_id, self.timeslot)
        if hist_ev:
            return (hist_ev.canteenId, hist_ev.confirmed)
        else:
            return (None, False)

    def _clear_confirmed(self, canteen_id):
        hist_ev = HistoryEvent.get_confirmed(self.history_id, self.timeslot)
        if hist_ev is None:
            return None
        hist_ev.cancelled = True
        if hist_ev.canteenId == canteen_id:
            return hist_ev
        else:
            hist_ev.put()

    def _datastore_append(self, canteen_id, confirmed, cancelled):
        if confirmed and not cancelled:
            hist_ev = self._clear_confirmed(canteen_id)
        else:
            hist_ev = HistoryEvent.get_canteen(self.history_id, self.timeslot, canteen_id)
        if hist_ev:
            # found it
            hist_ev.event_date = datetime.datetime.utcnow()
            if cancelled:
                hist_ev.cancelled = cancelled
                # leave confirmed unchanged
            else:
                hist_ev.confirmed = confirmed
                hist_ev.cancelled = cancelled
            hist_ev.put()
        else:
            # not found, create a new HistoryEvent
            if confirmed and cancelled:
                import logging
                logging.warn("The event is confirmed and cancelled but cannot be found in datastore")
            hist_ev = HistoryEvent(historyId=self.history_id, timeslot=self.timeslot,
                        event_date=datetime.datetime.utcnow(), confirmed=confirmed, cancelled=cancelled,
                        canteenId=canteen_id)
            hist_ev.put()

    @classmethod
    def gen_new_history_id(cls):
        """Generate new History ID, usually called by __init__;
           however caller can call this directly to avoid creating new object

           FIXME: a more robust random algorithm (and detection) should be used to avoid hash conflicts.
        """
        from Crypto.Hash import MD5
        import random
        return "history:" + MD5.new(repr(random.randint(0, 100000))).hexdigest()
        # FIXME: use more robust algorithm

    @classmethod
    def _valid_history_id(cls, history_id):
        if history_id is None:
            return False
        elif history_id.startswith("history:"):
            return True
        elif history_id.startswith("user:"):
            return True
        else:
            return False

    @classmethod
    def from_user(cls, user):
        "A user inherits a history, but shares no namespace"
        if user == None:
            return History()
        else:
            return History("user:" + user.user_id())

    def __init__(self, history_id=None, timeslot=None):
        if not History._valid_history_id(history_id):
            history_id = History.gen_new_history_id()
        self.history_id = history_id
        if timeslot is not None:
            self.timeslot = timeslot
        else:
            self.timeslot = HistoryEvent.get_max_timeslot(self.history_id)
        self.next_recommend, self.confirmed = self._datastore_get_no_cancelled()

    def cancel(self, canteen_id):
        """cancel means the user clicks <NO>, two cases:
           the recommendation has been confirmed before: confirmed, cancelled
           otherwise: cancelled"""
        once_confirmed = False
        if self.next_recommend == canteen_id:
            once_confirmed = self.confirmed
            self.confirmed = False
            self.next_recommend = None
        self._datastore_append(canteen_id, once_confirmed, True)
        # Then append a cancel log to the datastore

    def confirm(self, canteen_id):
        "confirm means the user clicks <YES>"
        self.confirmed = True
        self.next_recommend = canteen_id
        self._datastore_append(canteen_id, True, False)

    def recommend(self, exclude=()):
        """called to get next recommend

           FIXME: call the backend to learn the fact for recommendation"""
        if self.next_recommend is None:
            choices = Choice.get_choices(history_id=self.history_id, exclude=exclude)
            if len(choices):
                import random
                self.confirmed = False
                self.next_recommend = Choice.choose_from(choices) # FIXME: backend...
                self._datastore_append(self.next_recommend, False, False)
            else:
                self.confirmed = False
                self.next_recommend = None
        return Recommendation(self.next_recommend, history_id=self.history_id, timeslot=self.timeslot, confirmed=self.confirmed)

    @classmethod
    def recommend_from(cls, history_id, timeslot, prevmeal=None, nextmeal=None, cancel=None, confirm=None):
        "this is what the user should call directly"
        if prevmeal:
            timeslot = Timeslot.prevmeal(history_id, timeslot)
        if nextmeal:
            timeslot = Timeslot.nextmeal(history_id, timeslot)
        history = History(history_id, timeslot)
        if cancel:
            history.cancel(cancel)
        if confirm:
            history.confirm(confirm)
        if cancel:
            return history.recommend(exclude=(cancel))
        else:
            return history.recommend()

@endpoints.api(name="lunchere", version="dev", description="Where to lunch", allowed_client_ids=ALLOWED_CLIENT_IDS)
class LuncHereAPI(remote.Service):
    def __init__(self):
        self.counter = 0
    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="today", http_method="GET")
    @require_login
    def today(self, request):
        recommendation = History.from_user(user=my_get_current_user()).recommend()
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="prevmealUnauth", http_method="GET")
    def prevmeal_unauth(self, request):
        "previous meal"
        self.counter += 1
        recommendation =  History.recommend_from(request.historyId, request.timeslot, prevmeal=True)
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="nextmealUnauth", http_method="GET")
    def nextmeal_unauth(self, request):
        "next meal"
        self.counter += 1
        recommendation =  History.recommend_from(request.historyId, request.timeslot, nextmeal=True)
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="todayUnauth", http_method="GET")
    def today_unauth(self, request):
        "default call"
        self.counter += 1
        recommendation = History.recommend_from(request.historyId, request.timeslot)
        return recommendation.to_rpc()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="noUnauth", http_method="GET")
    def no_unauth(self, request):
        "cancel/reject"
        self.counter += 1
        recommendation = History.recommend_from(request.historyId, request.timeslot, cancel=request.name)
        return recommendation.to_rpc()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="yesUnauth", http_method="GET")
    def yes_unauth(self, request):
        "confirm"
        self.counter += 1
        recommendation = History.recommend_from(request.historyId, request.timeslot, confirm=request.name)
        return recommendation.to_rpc()


# ==============
ENDPOINTS_APPLICATION = endpoints.api_server([LuncHereAPI], restricted=False)

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    """/ redirect to /history/RANDOM_STRING;
       /history/.* and /user/.* generate a page with some variable set according to current history/user;
       /logout clears cookie and redirect to /
       others redirect to /

       (maybe should change to:)

       / shows homepage
       /new redirect to /history/RANDOM_STRING;
       /history/.* and /user/.* generate a page with some variable set according to current history/user;
       /login requires user?
       /logout clears cookie and redirect to /
       others redirect to /
    """

    def _get_history_id(self, use_cookie=True):
        "generate History ID (XX:YY) from URL (/XX/YY)"
        request = self.request # to avoid pylint abusing request
        if request.path.startswith("/user"):
            user = my_get_current_user(False)
            if user != None:
                # FIXME: should report error to the user rather
                return repr(History.from_user(user).history_id)
        elif request.path.startswith("/history/"):
            import re
            return repr(re.compile("^/history/").sub("history:", request.path))
        elif use_cookie:
            return "getCookie(\"historyId\", \"Unknown\")"
        else:
            return None

    def get(self):
        "default behavior"

        request, response = self.request, self.response
        use_cookie = True
        # but in the following call, do not use_cookie, so that
        # the history_id is got from the user sent cookie directly rather
        # than in the client side.
        history_id = self._get_history_id(use_cookie=False)
        if history_id:
            response.headers['Content-Type'] = 'text/html'
            response.headers['Cache-Control'] = 'no-cache'

            response.write(open("test.html").read().replace("@@CLIENT_ID@@", CLIENT_ID_ALL_JS)
                                                        .replace("@@HISTORY_ID@@", self._get_history_id())
                                                        .replace("@@USE_COOKIE@@", "1" if use_cookie else "0"))
        else:
            import urllib
            if use_cookie and request.path != "/logout":
                # maybe redirect to "/", and clear the cookie directly?
                history_id = request.cookies.get("historyId", None)
                if history_id is not None:
                    history_id = urllib.unquote(history_id)
            if history_id == None:
                history_id = History.gen_new_history_id()
                if use_cookie:
                    response.set_cookie("historyId", urllib.quote(history_id), max_age=7)
            self.redirect(str(history_id).replace("history:", "/history/"))

APPLICATION = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

