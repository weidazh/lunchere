from google.appengine.ext import endpoints
from google.appengine.api import users
from google.appengine.api import oauth
from protorpc import remote
from protorpc import messages


# endpoints: https://developers.google.com/appengine/docs/python/endpoints/
# protorpc:  https://developers.google.com/appengine/docs/python/tools/protorpc/
class TestRequestResponseMsg(messages.Message):
    text = messages.StringField(1, required=False)
    user = messages.StringField(2, required=False)
    code = messages.IntegerField(3, required=False)

class NoneRequestMsg(messages.Message):
    pass

class HistoryIdMsg(messages.Message):
    historyId = messages.StringField(1, required=False)
    timeslot = messages.IntegerField(2, required=False)

class TodayRecommendation(messages.Message):
    name = messages.StringField(1, required=True)
    historyId = messages.StringField(2, required=True)
    timeslot = messages.IntegerField(3, required=False)
    confirmed = messages.BooleanField(4, required=False)
    timeslotFriendly = messages.StringField(5, required=False)


# CLIENT_ID_http      = '418397336121.apps.googleusercontent.com'
# CLIENT_ID_https     = '418397336121-7u3gsnvbj6d5gan0102e83rb9gd4vd67.apps.googleusercontent.com'
# CLIENT_ID_localhost = '418397336121-s6drlbeccaq3iopnslmf5i5gqcnlmda8.apps.googleusercontent.com'
CLIENT_ID_all_js      = '418397336121-13ej5mm6b5hef5n6qt87e2rj3u155f2l.apps.googleusercontent.com'

ALLOWED_CLIENT_IDS = [# CLIENT_ID_http, CLIENT_ID_https, CLIENT_ID_localhost,
                      CLIENT_ID_all_js,
                      endpoints.API_EXPLORER_CLIENT_ID]


###### Auth Docs:
#  https://developers.google.com/appengine/docs/python/endpoints/auth
#  https://developers.google.com/appengine/docs/python/endpoints/create_api#allowed-clients-and-audiences
#  https://developers.google.com/appengine/docs/python/endpoints/consume_js#adding-oath-authentication
#  https://developers.google.com/api-client-library/python/guide/google_app_engine
class OAuthURLMsg(messages.Message):
    url = messages.StringField(1, required=False)

@endpoints.api(name="oauth", version="dev", description="OAuth", allowed_client_ids=ALLOWED_CLIENT_IDS)
class OAuthAPI(remote.Service):
    @endpoints.method(OAuthURLMsg, OAuthURLMsg, name="createLoginURL", http_method="GET")
    def create_login_url(self, request):
        if not request.url:
            request.url = "/"
        return OAuthURLMsg(url=users.create_login_url(request.url))

    @endpoints.method(OAuthURLMsg, OAuthURLMsg, name="createLogoutURL", http_method="GET")
    def create_logout_url(self, request):
        if not request.url:
            request.url = "/"
        return OAuthURLMsg(url=users.create_logout_url(request.url))

def my_get_current_user(raiseUnauth=True):
    user = endpoints.get_current_user()
    if raiseUnauth and user == None:
        raise endpoints.UnauthorizedException("Invalid token")
    return user

def require_login(func):
    def wrapper(*args, **kargs):
        my_get_current_user()
        return func(*args, **kargs)
    return wrapper

class Recommendation:
    def __init__(self, name, historyId, timeslot, confirmed):
        self.name = name
        self.historyId = historyId
        self.timeslot = timeslot
        self.confirmed = confirmed

    def toTodayRecommendation(self):
        if self.name is not None:
            name = self.name
        else:
            name = ""
        if self.timeslot is not None:
            timeslotFriendly = Timeslot.user_friendly(self.timeslot)
        else:
            timeslotFriendly = None
        return TodayRecommendation(name=name, historyId=self.historyId,
                                timeslot=self.timeslot, timeslotFriendly=timeslotFriendly,
                                confirmed=self.confirmed)

import datetime
from google.appengine.ext import db
class HistoryEvent(db.Model):
    historyId = db.StringProperty(required=True)
    timeslot = db.IntegerProperty(required=True)
    event_date = db.DateTimeProperty(required=True)
    # 4 cases: initilized, confirmed, cancelled, confirmed and cancelled
    confirmed = db.BooleanProperty()
    cancelled = db.BooleanProperty()
    canteenId = db.StringProperty(required=True)

    @classmethod
    def get_event_date(cls, historyId, timeslot):
        he = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2 ORDER BY event_date DESC", historyId, timeslot)
        he = he.get()
        if he is not None:
            return he.event_date
        else:
            return None

    @classmethod
    def get_max_timeslot(cls, historyId):
        he = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 ORDER BY timeslot DESC", historyId)
        he = he.get()
        if he is not None:
            return he.timeslot
        else:
            return 2

    @classmethod
    def get_prev_timeslot(cls, historyId, timeslot):
        he = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot < :2 ORDER BY timeslot DESC", historyId, timeslot)
        he = he.get()
        if he is not None:
            return he.timeslot
        else:
            return None

    @classmethod
    def get_next_timeslot(cls, historyId, timeslot):
        he = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot > :2 ORDER BY timeslot ASC", historyId, timeslot)
        he = he.get()
        if he is not None:
            return he.timeslot
        else:
            return None

    @classmethod
    def has_confirmed(cls, historyId, timeslot):
        he = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2 AND confirmed = True AND cancelled = False", historyId, timeslot)
        he = he.get()
        return he is not None
class Choice(db.Model):
    historyId = db.StringProperty(required=True)
    canteenId = db.StringProperty(required=True)
    frequency = db.FloatProperty(required=True) # Initially each one has sum(frequency) / (n - 1)
    based_on = db.DateTimeProperty(required=True) # If None then 1970/1/1
    max_timeslot = db.IntegerProperty(required=True) # If None then 0

class Hints(db.Model):
    historyId = db.StringProperty(required=True)
    hint_key = db.StringProperty(required=True)
    hint_value = db.StringProperty(required=False)

    @classmethod
    def get_hint(cls, historyId, key, def_value):
        hint = db.GqlQuery("SELECT * FROM Hints WHERE historyId = :1 AND key = :2", historyId, key)
        value = hint.get()
        if value is None:
            return def_value
        else:
            return value.hint_value

    @classmethod
    def set_hint(cls, historyId, key, value):
        hint = db.GqlQuery("SELECT * FROM Hints WHERE historyId = :1 AND key = :2", self.historyId, key)
        value = hint.get()
        if value is None:
            hint = Hints(historyId=historyId, hint_key=key, hint_value=value)
            hint.put()
        else:
            hint.hint_value = value
            hint.put()

import datetime
class TZInfo(datetime.tzinfo):
    ZERO = datetime.timedelta(hours=0)
    def __init__(self, tzname):
        if tzname == "HKT":
            self._offset = datetime.timedelta(hours=8)
        else:
            raise Exception("Unknown timezone")
        self._tzname = tzname

    def tzname(self, dt):
        return self._tzname

    def utcoffset(self, dt):
        return self._offset + self.dst(dt)

    def dst(self, dt):
        "currently has no dst"
        return TZInfo.ZERO

class Timeslot:
    @classmethod
    def guess_local_timeslot(cls, historyId):
        tz = TZInfo(Hints.get_hint(historyId, "timezone", "HKT"))
        utcnow = datetime.datetime.utcnow()
        localnow = tz.fromutc(utcnow.replace(tzinfo=tz))
        import logging
        logging.info("local time is %s" % (localnow.isoformat()))
        return localnow.year * 10000 + localnow.month * 100 + localnow.day

    @classmethod
    def ordinal(cls, n):
        if str(n).endswith("1") and not str(n).endswith("11"):
            return "st"
        elif str(n).endswith("2") and not str(n).endswith("12"):
            return "nd"
        elif str(n).endswith("3") and not str(n).endswith("13"):
            return "rd"
        else:
            return "th"

    @classmethod
    def user_friendly(cls, timeslot):
        import logging
        return "%d-%d-%d %d%s meal" % (timeslot / 1000000, timeslot / 10000 % 100, timeslot / 100 % 100, timeslot % 100, Timeslot.ordinal(timeslot % 100))

    @classmethod
    def prevmeal(cls, historyId, timeslot):
        if timeslot is None:
            timeslot = HistoryEvent.get_max_timeslot(historyId)
        prev_timeslot = HistoryEvent.get_prev_timeslot(historyId, timeslot)
        if prev_timeslot is None:
            return timeslot
        else:
            return prev_timeslot

    @classmethod
    def nextmeal(cls, historyId, timeslot):
        import logging
        logging.info("nextmeal(%s, %d)" % (historyId, timeslot))
        if timeslot is None:
            timeslot = HistoryEvent.get_max_timeslot(historyId)
        else:
            exists_next_timeslot = HistoryEvent.get_next_timeslot(historyId, timeslot)
            if exists_next_timeslot:
                return exists_next_timeslot # pivot to next timeslot

        base = Timeslot.guess_local_timeslot(historyId) * 100
        if timeslot >= base and HistoryEvent.has_confirmed(historyId, timeslot):
            return timeslot + 1         # most recent timeslot, old date
        elif timeslot >= base:
            return timeslot             # most recent timeslot but not confirmed
        else:
            return base + 1             # most recent timeslot and new date

class History:
    def choose_from(self, choices):
        _sum = sum([freq for name, freq in choices])
        import random
        r = random.random() * _sum
        import logging
        logging.info("r = %f" % r)
        for name, freq in choices:
            if freq >= r:
                return name
            r -= freq
    def datastore_get_choices(self, exclude=None):
        canteenIds = {}
        if exclude is not None and len(exclude):
            for e in exclude:
                canteenIds[e] = True
        choice_list = db.GqlQuery("SELECT * FROM Choice WHERE historyId = :1", self.historyId)
        choices = []
        max_timeslot = 0
        for choice in choice_list.run():
            if canteenIds.has_key(choice.canteenId):
                # already in choices, or excluded
                continue
            choices.append((choice.canteenId, choice.frequency))
            canteenIds[choice.canteenId] = True
            if choice.max_timeslot > max_timeslot:
                max_timeslot = choice.max_timeslot
        if len(choices):
            avg = sum([freq for name, freq in choices]) / len(choices)
        else:
            avg = 1.0
        import logging
        logging.info("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot >= :2")
        logging.info(self.historyId)
        logging.info(max_timeslot)
        new_choices = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot >= :2", self.historyId, max_timeslot)
        for he in new_choices.run():
            logging.info(he)
            logging.info(repr(he.canteenId))
            logging.info(repr(he.timeslot))
            if canteenIds.has_key(he.canteenId):
                # already in choices
                continue
            canteenIds[he.canteenId] = True
            choices.append((he.canteenId, avg))
        logging.info(choices)
        logging.info(canteenIds)
        return choices

    # CHOICES = ["Cafe de Coral", "Fairwood", "Maxim", "Hua ren", "McDonald", "KFC", "Bang Bang Chicken", "Fairwood (Westwood)", "Yoshinoya", "Bijas", "Canada Restaurant"]
    # confirm_table = {}
    def datastore_set_confirmed(self):
        # History.confirm_table[timeslot + historyId] = confirm
        pass

    def datastore_get_confirmed(self):
        confirmed_list = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2 AND cancelled = False", self.historyId, self.timeslot)
        he = confirmed_list.get()
        if he:
            return (he.canteenId, he.confirmed)
        else:
            return (None, False)

    def datastore_pop_confirmed(self):
        pass

    def clear_confirmed(self, name):
        # clear any other confirmed.
        confirm_q = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2", self.historyId, self.timeslot)
        ret = None
        for e in confirm_q:
            if e.canteenId != name:
                if e.confirmed and not e.cancelled:
                    e.cancelled = True
                    e.put()
            else:
                ret = e
        return ret

    def datastore_append(self, name, confirmed, cancelled):
        if confirmed and not cancelled:
            this_canteen = self.clear_confirmed(name)
        else:
            this_canteen_q = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2 AND canteenId = :3", self.historyId, self.timeslot, name)
            this_canteen = this_canteen_q.get()
        if this_canteen:
            # found it
            he = this_canteen
            he.event_date = datetime.datetime.utcnow()
            if cancelled:
                he.cancelled = cancelled
                # leave confirmed unchanged
            else:
                he.confirmed = confirmed
                he.cancelled = cancelled
            he.put()
        else:
            # not found, create a new HistoryEvent
            if confirmed and cancelled:
                import logging
                logging.warn("The event is confirmed and cancelled but cannot be found in datastore")
            he = HistoryEvent(historyId=self.historyId, timeslot=self.timeslot,
                        event_date=datetime.datetime.utcnow(), confirmed=confirmed, cancelled=cancelled,
                        canteenId=name)
            he.put()

    @classmethod
    def gen_new_history_id(cls):
        from Crypto.Hash import MD5
        import random
        return "history:" + MD5.new(repr(random.randint(0, 100000))).hexdigest() # FIXME: user more robust algorithm

    @classmethod
    def valid_history_id(cls, historyId):
        if historyId is None:
            return False
        elif historyId.startswith("history:"):
            return True
        elif historyId.startswith("user:"):
            return True
        else:
            return False

    @classmethod
    def from_user(cls, user):
        if user == None:
            return History()
        else:
            return History("user:" + user.user_id())

    def get_timeslot(self):
        # return int(time.time() / (24 * 3600)) * 24 * 3600
        return HistoryEvent.get_max_timeslot(self.historyId)

    def __init__(self, historyId=None, timeslot=None):
        if not History.valid_history_id(historyId):
            historyId = History.gen_new_history_id()
        self.historyId = historyId
        if timeslot is not None:
            self.timeslot = timeslot
        else:
            self.timeslot = self.get_timeslot()
        self.next_recommend, self.confirmed = self.datastore_get_confirmed()

    def cancel(self, name):
        once_confirmed = False
        if self.next_recommend == name:
            once_confirmed = self.confirmed
            self.confirmed = False
            self.next_recommend = None
            self.datastore_pop_confirmed()
        self.datastore_append(name, once_confirmed, True)
        # Then append a cancel log to the datastore

    def confirm(self, name):
        self.confirmed = True
        self.next_recommend = name
        self.datastore_append(name, True, False)

    def recommend(self, exclude=None):
        if self.next_recommend is None:
            choices = self.datastore_get_choices(exclude=exclude)
            import logging
            logging.info(choices)
            if len(choices):
                import random
                self.confirmed = False
                self.next_recommend = self.choose_from(choices) # FIXME: backend...
                self.datastore_append(self.next_recommend, False, False)
            else:
                self.confirmed = False
                self.next_recommend = None
        return Recommendation(self.next_recommend, historyId=self.historyId, timeslot=self.timeslot, confirmed=self.confirmed)


def get_recommendation_from_history(historyId, timeslot=None, prevmeal=None, nextmeal=None, cancel=None, confirm=None):
    if prevmeal:
        timeslot = Timeslot.prevmeal(historyId, timeslot)
    if nextmeal:
        timeslot = Timeslot.nextmeal(historyId, timeslot)
    history = History(historyId, timeslot)
    if cancel:
        history.cancel(cancel)
    if confirm:
        history.confirm(confirm)
    if cancel:
        return history.recommend(exclude=[cancel])
    else:
        return history.recommend(exclude=None)

@endpoints.api(name="lunchere", version="dev", description="Where to lunch", allowed_client_ids=ALLOWED_CLIENT_IDS)
class LuncHereAPI(remote.Service):
    @endpoints.method(TestRequestResponseMsg, TestRequestResponseMsg, name="test", http_method="GET")
    def test(self, request):
        return TestRequestResponseMsg(text="Test", user=repr(my_get_current_user(False)), code=400)

    @endpoints.method(NoneRequestMsg, TodayRecommendation, name="today", http_method="GET")
    @require_login
    def today(self, request):
        recommendation = History.from_user(user=my_get_current_user()).recommend()
        return recommendation.toTodayRecommendation()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="prevmealUnauth", http_method="GET")
    def prevmeal_unauth(self, request):
        recommendation =  get_recommendation_from_history(request.historyId, timeslot=request.timeslot, prevmeal=True)
        return recommendation.toTodayRecommendation()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="nextmealUnauth", http_method="GET")
    def nextmeal_unauth(self, request):
        recommendation =  get_recommendation_from_history(request.historyId, timeslot=request.timeslot, nextmeal=True)
        return recommendation.toTodayRecommendation()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="todayUnauth", http_method="GET")
    def today_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, timeslot=request.timeslot)
        return recommendation.toTodayRecommendation()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="noUnauth", http_method="GET")
    def no_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, timeslot=request.timeslot, cancel=request.name)
        return recommendation.toTodayRecommendation()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="yesUnauth", http_method="GET")
    def yes_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, timeslot=request.timeslot, confirm=request.name)
        return recommendation.toTodayRecommendation()


# ==============
endpoints_application = endpoints.api_server([OAuthAPI, LuncHereAPI], restricted=False)

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    def get_client_id(self):
        return CLIENT_ID_all_js

    def get_history_id(self, useCookie=True):
        if self.request.path.startswith("/user"):
            user = my_get_current_user(false)
            if user != None:
                return repr(History.from_user(user).historyId)
        elif self.request.path.startswith("/history/"):
            import re
            return repr(re.compile("^/history/").sub("history:", self.request.path))
        elif useCookie:
            return "getCookie(\"historyId\", \"Unknown\")"
        else:
            return None

    def get(self):
        useCookie = True
        historyId = self.get_history_id(useCookie=False)
        if historyId:
            import logging
            self.response.headers['Content-Type'] = 'text/html'
            self.response.headers['Cache-Control'] = 'no-cache'
            logging.info(self.request.path)

            self.response.write(open("test.html").read().replace("@@CLIENT_ID@@", self.get_client_id())
                                                        .replace("@@HISTORY_ID@@", self.get_history_id())
                                                        .replace("@@USE_COOKIE@@", "1" if useCookie else "0"))
        else:
            if useCookie and self.request.path != "/logout":
                import urllib
                historyId = self.request.cookies.get("historyId", None)
                if historyId is not None:
                    historyId = urllib.unquote(historyId)
            if historyId == None:
                historyId = History.gen_new_history_id()
                if useCookie:
                    import urllib
                    self.response.set_cookie("historyId", urllib.quote(historyId), max_age=7)
            self.redirect(str(historyId).replace("history:", "/history/"))

test = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

