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
import logging
import random
import urllib
import os


LUNCHERE_API_VERSION = "dev"

# endpoints: https://developers.google.com/appengine/docs/python/endpoints/
# protorpc:  https://developers.google.com/appengine/docs/python/tools/protorpc/

class HistoryIdMsg(messages.Message):
    "Used by RPC for cases where historyId or timeslot is unknown"
    historyId = messages.StringField(1, required=False)
    timeslot = messages.IntegerField(2, required=False)

class HintsMessage(messages.Message):
    ll = messages.StringField(1, required=False)
    near = messages.StringField(2, required=False)

class TodayRecommendation(messages.Message):
    "Return to client or confirm/cancel from client"
    name = messages.StringField(1, required=True)
    historyId = messages.StringField(2, required=True)
    timeslot = messages.IntegerField(3, required=False)
    confirmed = messages.BooleanField(4, required=False)
    timeslotFriendly = messages.StringField(5, required=False)
    could_delete = messages.BooleanField(6, required=False)
    has_prevmeal = messages.BooleanField(7, required=False)
    has_nextmeal = messages.BooleanField(8, required=False)
    has_createmeal = messages.BooleanField(9, required=False)
    has_other_recommend = messages.BooleanField(10, required=False)
    api_version = messages.StringField(11, required=False)
    hints = messages.MessageField(HintsMessage, 12, required=False)
    foursquare_id = messages.StringField(13, required=False)
    mealname = messages.StringField(14)

class OneChoice(messages.Message):
    canteen_id = messages.StringField(1, required=True)
    freq = messages.FloatField(2, required=True)
    foursquare_id = messages.StringField(3, required=False)

class TodayChoices(messages.Message):
    "Return to client for recommendation"
    historyId = messages.StringField(1, required=True)
    timeslot = messages.IntegerField(2, required=False)
    choices = messages.MessageField(OneChoice, 3, repeated=True)


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

class RecommendationChoices:
    def __init__(self, history_id, timeslot, choices=()):
        self.history_id = history_id
        self.timeslot = timeslot
        self.choices = list(choices)

    def append(self, canteen_id, freq):
        self.choices.append((canteen_id, freq))

    def to_rpc(self):
        choices = [OneChoice(canteen_id=c, freq=f, foursquare_id=FoursquareVenue.get_4qr_id(self.history_id, c)) for c, f in self.choices]
        logging.debug("choices.len = %d " % len(choices))
        return TodayChoices(historyId=self.history_id, timeslot=self.timeslot, choices=choices)

class Recommendation:
    "Intermediate class, actually I think it could be replaced with a tuple or so"
    def __init__(self, canteen_id, has_other_recommend, history_id, timeslot, confirmed, hints):
        self.canteen_id = canteen_id
        self.has_other_recommend = has_other_recommend
        self.history_id = history_id
        self.timeslot = timeslot
        self.confirmed = confirmed
        self.hints = hints

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
        logging.info("COULD_DELETE:")
        could_delete = Timeslot.delete_and_prevmeal(self.history_id, self.timeslot, dry_run=True, fallback=False, create=False)
        logging.info("COULD_DELETE: " + repr(could_delete))
        could_delete = not not could_delete
        has_prevmeal = not not Timeslot.prevmeal(self.history_id, self.timeslot, fallback=False, create=False)
        has_nextmeal = not not Timeslot.nextmeal(self.history_id, self.timeslot, fallback=False, create=False)
        logging.info("HAS_CREATEMEAL:")
        has_createmeal = Timeslot.nextmeal(self.history_id, self.timeslot, fallback=False, create=True, create_only=True)
        logging.info("HAS_CREATEMEAL: " + repr(has_createmeal))
        has_createmeal = not not has_createmeal
        mealname = TimeslotModel.get_mealname(self.history_id, self.timeslot)
        hints = HintsMessage()
        logging.debug(self.hints)
        for key in self.hints:
            logging.debug("setattr %s %s %s" % (repr(hints), repr(key), repr(self.hints[key])))
            setattr(hints, key, self.hints[key])
        foursquare_id = FoursquareVenue.get_4qr_id(self.history_id, canteen_id)
        return TodayRecommendation(name=canteen_id, historyId=self.history_id,
                                timeslot=self.timeslot, timeslotFriendly=timeslot_friendly,
                                confirmed=self.confirmed,
                                could_delete=could_delete, has_nextmeal=has_nextmeal, has_prevmeal=has_prevmeal, has_createmeal=has_createmeal,
                                has_other_recommend=self.has_other_recommend,
                                api_version=LUNCHERE_API_VERSION, hints=hints,
                                foursquare_id=foursquare_id,
                                mealname=mealname)


class HistoryEvent(db.Model):
    """A HistoryEvent is an record in History,
       all the records in the same History share the same History ID"""
    historyId = db.StringProperty()
    timeslot = db.IntegerProperty()
    event_date = db.DateTimeProperty()
    # 4 cases: initilized, confirmed, cancelled, confirmed and cancelled
    confirmed = db.BooleanProperty()
    cancelled = db.BooleanProperty()
    canteenId = db.StringProperty()

    @classmethod
    def get_max_timeslot_or_none(cls, history_id):
        """max timeslot of the specified history_id
           FIXME: it should return TODAY01 for the History.__init__ caller

           Could return None! If you do not want None, use Timeslot.most_recent instead"""
        # db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id))
        # should use Hints

        hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id))\
                                        .order("-timeslot").get()
        if hist_ev is None:
            hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 ORDER BY timeslot DESC", history_id).get()
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
        if hist_ev is None:
            return None
        timeslot = getattr(hist_ev, "timeslot", None)
        return timeslot

    @classmethod
    def get_prev_timeslot(cls, history_id, timeslot0):
        "max timeslot < timeslot0 of the specified history_id"
        # hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id))\
        #                                 .filter("timeslot <", timeslot0)\
        #                                 .order("-timeslot").get()
        hist_ev = None
        if hist_ev is None:
            hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot < :2 ORDER BY timeslot DESC", history_id, timeslot0).get()
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
        return getattr(hist_ev, "timeslot", None)

    @classmethod
    def get_next_timeslot(cls, history_id, timeslot0):
        "min timeslot > timeslot0 of the specified history_id"
        # hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id))\
        #                                 .filter("timeslot >", timeslot0)\
        #                                 .order("timeslot").get()
        hist_ev = None
        if hist_ev is None:
            hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot > :2 ORDER BY timeslot ASC", history_id, timeslot0).get()
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
        return getattr(hist_ev, "timeslot", None)

    @classmethod
    def get_no_cancelled(cls, history_id, timeslot):
        """There should be at most one HistoryEvent that is not cancelled:
           the one I just recommend and not yet confirmed, or,
           the one that has been confirmed"""
        hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot)))\
                                        .filter("cancelled =", False).get()
        if hist_ev is None:
            # hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
            #             "historyId = :1 AND timeslot = :2 AND cancelled = False", history_id, timeslot).get()
            pass
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
        return hist_ev

    @classmethod
    def foreach_no_cancelled(cls, history_id, timeslot):
        """Yield each HistoryEvent which is not cancelled"""
        # FIXME: temporarily cannot use ancestor until I decide to migrate the database
        # for hist_ev in db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
        #                 "historyId = :1 AND timeslot = :2 AND cancelled = False", history_id, timeslot).run():
        #     yield hist_ev
        for hist_ev in db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot)))\
                                             .filter("cancelled =", False).run():
            yield hist_ev

    @classmethod
    def foreach_hist_ev(cls, history_id, timeslot):
        """Yield each HistoryEvent, no condition"""
        for hist_ev in db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot))).run():
            yield hist_ev

    @classmethod
    def get_confirmed(cls, history_id, timeslot):
        """There should be at most one HistoryEvent that is confirmed and not cancelled"""
        hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot)))\
                                        .filter("confirmed =", True)\
                                        .filter("cancelled =", False).get()
        if hist_ev is None:
            hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2 AND " +
                        "confirmed = True AND cancelled = False", history_id, timeslot).get()
            if hist_ev is not None:
                logging.debug("RETURN from weak consistency! %s" % (repr(hist_ev.key().to_path())))
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
        return hist_ev

    @classmethod
    def get_canteen(cls, history_id, timeslot, canteen_id):
        "select the canteen by canteen_id"
        hist_ev = db.Query(HistoryEvent).ancestor(db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot), "HistoryEvent", canteen_id)).get()
        if hist_ev is None:
            hist_ev = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2 AND canteenId = :3",
                        history_id, timeslot, canteen_id).get()
        else:
            logging.debug("RETURN from strong consistency! %s" % (repr(hist_ev.key().to_path())))
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
    def alg_freq_filter(cls, freq):
        "Maybe random, maybe bias the often restaurant"
        return 1.0

    @classmethod
    def get_choices(cls, history_id, timeslot0, exclude=(), avoid_cancelled=True):
        canteenIds = dict([(e, True) for e in exclude])
        choice_list = db.GqlQuery("SELECT * FROM Choice WHERE " +
                        "historyId = :1", history_id)
        choices = {}
        max_timeslot = 0

        for (canteen_id, freq, choice) in Choice._yield_choices(choice_list, canteenIds):
            if choice.max_timeslot > max_timeslot:
                max_timeslot = choice.max_timeslot
            choices[canteen_id] = Choice.alg_freq_filter(freq)

        if len(choices):
            avg = sum([freq for canteen_id, freq in choices]) / len(choices)
        else:
            avg = 1.0

        choice_list = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot >= :2", history_id, max_timeslot)
        for (canteen_id, freq, hist_ev) in Choice._yield_choices(choice_list, canteenIds, deffreq=avg):
            choices[canteen_id] = Choice.alg_freq_filter(freq)

        if not avoid_cancelled:
            return choices.items()

        choice_list = db.GqlQuery("SELECT * FROM HistoryEvent WHERE " +
                        "historyId = :1 AND timeslot = :2", history_id, timeslot0)
        for (canteen_id, freq, hist_ev) in Choice._yield_choices(choice_list, {}, deffreq=avg):
            if canteenIds.has_key(canteen_id) and choices.has_key(canteen_id):
                choices.pop(canteen_id)
        return choices.items()

    @classmethod
    def choose_from(cls, choices):
        _sum = sum([freq for canteen_id, freq in choices])
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
        hint = db.Query(Hints).ancestor(db.Key.from_path("Timeline", history_id, "Hints", key)).get()
        if hint is not None:
            logging.debug("RETURN from strong consistency! Timeline %s Hints %s" % (repr(history_id), repr(key)))
            return hint.hint_value

        hint = db.GqlQuery("SELECT * FROM Hints WHERE " +
                        "historyId = :1 AND hint_key = :2", history_id, key)
        value = hint.get()
        if value is None:
            return def_value
        else:
            return value.hint_value

    @classmethod
    def set_hint(cls, history_id, key, value):
        hint = db.Query(Hints).ancestor(db.Key.from_path("Timeline", history_id, "Hints", key)).get()
        if hint is not None:
            logging.debug("RETURN from strong consistency! Timeline %s Hints %s" % (repr(history_id), repr(key)))
        else:
            hint = db.GqlQuery("SELECT * FROM Hints WHERE " +
                        "historyId = :1 AND hint_key = :2", history_id, key)
            hint = hint.get()
        if hint is None:
            hint = Hints(parent=db.Key.from_path("Timeline", history_id),
                         key_name=key,
                         historyId=history_id, hint_key=key, hint_value=value)
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

class TimeslotModel(db.Model):
    historyId = db.StringProperty()
    timeslot = db.IntegerProperty()
    createdt = db.DateTimeProperty()
    mealname = db.StringProperty()

    @classmethod
    def guess_meal_name(cls, dt):
        if dt.hour < 4 or dt.hour >= 22:
            return "Night Snack"
        elif dt.hour <= 10:
            return "Breakfast"
        elif dt.hour <= 13:
            return "Lunch"
        elif dt.hour <= 17:
            return "Tea"
        elif dt.hour <= 20:
            return "Dinner"
        else:
            return "Supper"

    @classmethod
    def get_refdate(cls, timeslot):
        yyyy = timeslot / 1000000
        mm = timeslot / 10000 % 100
        dd = timeslot / 100 % 100
        ordinal = timeslot % 100
        if ordinal == 1:
            return datetime.datetime(yyyy, mm, dd, 12)
        else:
            return datetime.datetime(yyyy, mm, dd, 19)

    @classmethod
    def key_path(cls, history_id, timeslot):
        return db.Key.from_path("Timeline", history_id, "Timeslot", str(timeslot))


    @classmethod
    def create(cls, history_id, timeslot, refmode="NOW"):
        if refmode == "NOW":
            "FIXME: consider the local time"
            tzinfo = TZInfo(Hints.get_hint(history_id, "timezone", "HKT"))
            utcnow = datetime.datetime.utcnow()
            createdt = tzinfo.fromutc(utcnow.replace(tzinfo=tzinfo))
        elif refmode == "TIMESLOT":
            createdt = cls.get_refdate(timeslot)
        else:
            raise Exception("Unknown refmode %s" % (repr(refmode),))
        mealname = cls.guess_meal_name(createdt)
        logging.debug("CREATE MEALNAME %d, %s, %s = %s" % (timeslot, repr(refmode), repr(createdt), repr(mealname)))
        tm  = TimeslotModel(parent=db.Key.from_path("Timeline", history_id),
                     key_name=str(timeslot),
                     historyId=history_id,
                     timeslot=timeslot,
                     createdt=createdt,
                     mealname=mealname)
        tm.put()
        return tm

    @classmethod
    def get_or_create(cls, history_id, timeslot, refmode="NOW"):
        tm = db.Query(TimeslotModel).ancestor(TimeslotModel.key_path(history_id, timeslot)).get()
        if tm is None:
            return cls.create(history_id, timeslot, refmode=refmode)
        else:
            return tm

    @classmethod
    def kind(cls):
        return "Timeslot"

    @classmethod
    def get_mealname(cls, history_id, timeslot):
        tm = cls.get_or_create(history_id, timeslot, refmode="TIMESLOT")
        if tm is None:
            raise Exception("Cannot get or create TimeslotModel for %s %d" % (history_id, timeslot))
        else:
            return tm.mealname

class Timeslot:
    @classmethod
    def guess_local_timeslot_base(cls, history_id):
        tzinfo = TZInfo(Hints.get_hint(history_id, "timezone", "HKT"))
        utcnow = datetime.datetime.utcnow()
        localnow = tzinfo.fromutc(utcnow.replace(tzinfo=tzinfo))
        return (localnow.year * 10000 + localnow.month * 100 + localnow.day) * 100

    @classmethod
    def _base(cls, timeslot):
        return timeslot - (timeslot % 100)

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
    def delete_and_prevmeal(cls, history_id, timeslot0, dry_run=False, fallback=True, create=True):
        """delete the meal timeslot = timeslot0 if no confirmed,
           if successful then jump to prevmeal

           timeslot0 should not be None
        """
        if fallback and not create:
            raise Exception("ERROR: program bug, fallback must create in most_recent")
        if timeslot0 is None:
            logging.warn("deleting a None timeslot0")
            "FIXME: report error"
            if fallback: # i.e. also create
                timeslot0 = Timeslot.most_recent(history_id, fallback=False, create=False)
                if timeslot0 is None:
                    logging.debug("timeslot0 is None, fallback, most_recent returns None if no create. So return most_recent with create. nothing deleted")
                    return Timeslot.most_recent(history_id, fallback=True, create=True)
                else:
                    logging.debug("timeslot0 is None, fallback, return most_recent, nothing deleted.")
                    # although fallback, I do not delete anything I guess
                    return timeslot0
            else:
                logging.debug("timeslot0 is None, no fallback")
                return None

        # FIXME: BUG, when cancel an option, the datastore seems slow and the thing is not reflected
        #        to the datastore, so that it could be confirmed, so the delete button is not available.
        #        refresh the page and this is OK.
        hist_ev = HistoryEvent.get_confirmed(history_id, timeslot0)
        # if hist_ev is not None:
        #     logging.warn("Cannot delete a confirmed meal")
        #     "FIXME: report error"
        #     if fallback: # assume deleted and move back to current timeslot0
        #         logging.debug("timeslot0 is confirmed, fallback, nothing deleted")
        #         return timeslot0
        #     else:
        #         logging.debug("timeslot0 is confirmed, no fallback, nothing deleted")
        #         return None
        if not dry_run:
            logging.warn("deleting")
            for hist_ev in HistoryEvent.foreach_hist_ev(history_id, timeslot0):
                if not dry_run:
                    hist_ev.delete()

        # Move to prev (or next meal)
        new_timeslot = Timeslot.prevmeal(history_id, timeslot0, fallback=False, create=False)
        logging.info("prev_timeslot = " + repr(new_timeslot))
        if new_timeslot is None:
            timeslot0 = Timeslot._base(timeslot0)
            new_timeslot = Timeslot.nextmeal(history_id, timeslot0, fallback=fallback, create=create)
            logging.warn("next_timeslot = " + repr(new_timeslot))
            logging.debug("timeslot0 is deleted, move to next or no fallback")
        else:
            logging.debug("timeslot0 is deleted, move to previous")
        return new_timeslot

    @classmethod
    def prevmeal(cls, history_id, timeslot0, fallback=True, create=False):
        """find the previous timeslot < timeslot0, if timeslot0 is None this is meaningless, return None directly;
           could be None!!!"""
        if timeslot0 is None:
            if not fallback:
                return None
            return Timeslot.most_recent(history_id, fallback=create, create=create) # only create when create
        prev_timeslot = HistoryEvent.get_prev_timeslot(history_id, timeslot0)
        if prev_timeslot is None and fallback:
            return timeslot0
        else:
            return prev_timeslot

    @classmethod
    def most_recent(cls, history_id, fallback=True, create=True):
        """find the most recent meal"""
        if fallback and not create:
            raise Exception("ERROR: program bug, fallback must create in most_recent")
        timeslot = HistoryEvent.get_max_timeslot_or_none(history_id)
        if timeslot is None and create:
            return Timeslot.guess_local_timeslot_base(history_id) + 1
        return timeslot

    @classmethod
    def nextmeal(cls, history_id, timeslot0, fallback=True, create=True, create_only=False):
        """find the next timeslot > timeslot0.
           create new timeslot only when current timeslot is confirmed, or,
           the day is changed.

           If input None, return Timeslot.most_recent()"""
        if timeslot0 is None:
            if not fallback:
                logging.info("timeslot0 is None and not fallback")
                return None
            if create_only:
                logging.info("timeslot0 is None and create_only")
                return None
            return Timeslot.most_recent(history_id, fallback=fallback, create=create)

        exists_next_timeslot = HistoryEvent.get_next_timeslot(history_id, timeslot0)
        if exists_next_timeslot:
            if create_only:
                logging.info("found next timeslot and create_only")
                return None
            else:
                logging.info("found next timeslot and not create_only")
                return exists_next_timeslot # pivot to next timeslot

        base = Timeslot.guess_local_timeslot_base(history_id)
        new_timeslot = None
        if timeslot0 >= base and HistoryEvent.get_confirmed(history_id, timeslot0):
            "INFO: Today new meal"
            new_timeslot = timeslot0 + 1 # most recent timeslot, old date
        elif timeslot0 <= base:
            "INFO: New date"
            new_timeslot = base + 1
        else:
            "INFO: Today old meal because not confirmed yet"
            "FIXME: Warn error, no moving to next meal"
            pass                         # most recent timeslot but not confirmed

        # create new timeslot
        if create and new_timeslot is not None:
            logging.info("new_timeslot is not None and create")
            """ Now create a new log in the datastore """
            TimeslotModel.get_or_create(history_id, new_timeslot)
            return new_timeslot
        elif create_only:
            logging.info("new_timeslot is None and create_only")
            return None
        elif fallback:
            logging.info("new_timeslot is None and fallback to timeslot0")
            return timeslot0
        else:
            logging.info("new_timeslot is None and not fallback")
            return None

class FoursquareVenue(db.Model):
    historyId = db.StringProperty(required=True)
    canteenId = db.StringProperty(required=True)
    foursquareId = db.StringProperty(required=True)

    @classmethod
    def get_4qr_id(cls, historyId, canteenId):
        if not canteenId: # empty or None
            return None
        foursquare_venue = db.Query(FoursquareVenue).ancestor(db.Key.from_path("Timeline", historyId, "FoursquareVenue", canteenId)).get()
        if foursquare_venue is not None:
            logging.debug("RETURN from strong consistency! Timeline %s FoursquareVenue %s" % (repr(historyId), repr(canteenId)))
            return foursquare_venue.foursquareId

        foursquare_venue = db.GqlQuery("SELECT * FROM FoursquareVenue WHERE " +
                            "historyId = :1 AND canteenId = :2", historyId, canteenId).get()
        if foursquare_venue is None:
            return None
        else:
            return foursquare_venue.foursquareId

    @classmethod
    def set_4qr_id(cls, historyId, canteenId, foursquareId):
        if historyId is None or canteenId is None or foursquareId is None:
            return
        if historyId == u"" or canteenId == u"" or foursquareId == u"":
            return
        foursquare_venue = db.Query(FoursquareVenue).ancestor(db.Key.from_path("Timeline", historyId, "FoursquareVenue", canteenId)).get()
        if foursquare_venue is None:
            foursquare_venue = db.GqlQuery("SELECT * FROM FoursquareVenue WHERE " +
                                "historyId = :1 AND canteenId = :2", historyId, canteenId).get()
        else:
            logging.debug("RETURN from strong consistency! Timeline %s FoursquareVenue %s" % (repr(historyId), repr(canteenId)))
        if foursquare_venue is None:
            foursquare_venue = FoursquareVenue(parent=db.Key.from_path("Timeline", historyId),
                                               key_name=canteenId,
                                               historyId=historyId, canteenId=canteenId, foursquareId=foursquareId)
            foursquare_venue.put()
        elif foursquare_venue.foursquareId != foursquareId:
            foursquare_venue.foursquareId = foursquareId
            foursquare_venue.put()

class History:
    "A history is a sequence of guessings, recommendations, confirms and rejects/cancels"
    def _datastore_get_no_cancelled(self):
        hist_ev = HistoryEvent.get_no_cancelled(self.history_id, self.timeslot)
        if hist_ev:
            return (hist_ev.canteenId, hist_ev.confirmed)
        else:
            return (None, False)

    def _clear_confirmed(self, canteen_id):
        for hist_ev in HistoryEvent.foreach_no_cancelled(self.history_id, self.timeslot):
            hist_ev.cancelled = True
            hist_ev.put()

    def _datastore_append(self, canteen_id, confirmed, cancelled):
        if confirmed and not cancelled:
            self._clear_confirmed(canteen_id)
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
                logging.warn("The event is confirmed and cancelled but cannot be found in datastore")
            hist_ev = HistoryEvent(
                        parent=db.Key.from_path("Timeline", self.history_id, "Timeslot", str(self.timeslot)),
                        key_name=canteen_id,
                        historyId=self.history_id, timeslot=self.timeslot,
                        event_date=datetime.datetime.utcnow(), confirmed=confirmed, cancelled=cancelled,
                        canteenId=canteen_id)
            hist_ev.put()

    @classmethod
    def gen_new_history_id_from_hints(cls, hints):
        # from Crypto.Hash import MD5
        # return "history:" + MD5.new(repr(hints.get("ll", "")) + repr(hints.get("near", ""))).hexdigest()
        return cls.gen_new_history_id()

    @classmethod
    def gen_new_history_id(cls):
        """Generate new History ID, usually called by __init__;
           however caller can call this directly to avoid creating new object

           FIXME: a more robust random algorithm (and detection) should be used to avoid hash conflicts.
        """
        from Crypto.Hash import MD5
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
        "History.__init__"
        if not History._valid_history_id(history_id):
            "FIXME: report error"
            history_id = History.gen_new_history_id()
        self.history_id = history_id
        if timeslot is not None:
            self.timeslot = timeslot
        else:
            self.timeslot = Timeslot.most_recent(self.history_id)
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

    def fetch(self, canteen_id):
        logging.debug("FETCH %s" % (repr(canteen_id),));
        if self.next_recommend is not None and self.confirmed:
            pass
        else:
            self.next_recommend = canteen_id
            hist_ev = HistoryEvent.get_canteen(self.history_id, self.timeslot, canteen_id)
            self.confirmed = hist_ev and hist_ev.confirmed and not hist_ev.cancelled

    def get_choices(self, exclude=()):
        if not isinstance(exclude, tuple):
            raise Exception("Programming error: input exclude is not tuple")
        logging.debug("EXCLUDE = " + repr(exclude))
        # if self.next_recommend is not None:
        #     exclude = exclude + (self.next_recommend,)
        choices = Choice.get_choices(history_id=self.history_id, timeslot0=self.timeslot, exclude=exclude, avoid_cancelled=False)
        return RecommendationChoices(self.history_id, self.timeslot, choices)


    def recommend(self, exclude=()):
        """called to get next recommend

           FIXME: call the backend to learn the fact for recommendation"""
        if not isinstance(exclude, tuple):
            raise Exception("Programming error: input exclude is not tuple")
        logging.info("EXCLUDE = " + repr(exclude))
        has_other_recommend = True
        hints = {
            "ll": Hints.get_hint(self.history_id, "ll", None),
            "near": Hints.get_hint(self.history_id, "near", None)
        }
        if self.next_recommend is None:
            choices = Choice.get_choices(history_id=self.history_id, timeslot0=self.timeslot, exclude=exclude)
            logging.info("CHOICES = " + repr(choices))
            if len(choices):
                self.confirmed = False
                self.next_recommend = Choice.choose_from(choices) # FIXME: backend...
                self._datastore_append(self.next_recommend, False, False)
            else:
                self.confirmed = False
                self.next_recommend = None
                has_other_recommend = not not (len(choices) + len(exclude))
        return Recommendation(self.next_recommend, has_other_recommend, history_id=self.history_id, timeslot=self.timeslot, confirmed=self.confirmed, hints=hints)


    @classmethod
    def choices_from(cls, history_id, timeslot):
        history = History(history_id, timeslot)
        return history.get_choices()

    @classmethod
    def recommend_from(cls, history_id, timeslot, prevmeal=None, nextmeal=None, deletemeal=None, cancel=None, confirm=None, fetch=None):
        "this is what the user should call directly"
        exclude= ()
        if deletemeal:
            timeslot = Timeslot.delete_and_prevmeal(history_id, timeslot)
        if prevmeal:
            timeslot = Timeslot.prevmeal(history_id, timeslot)
        if nextmeal:
            timeslot = Timeslot.nextmeal(history_id, timeslot)
        history = History(history_id, timeslot)
        if cancel:
            history.cancel(cancel)
            exclude += (cancel,)
        if confirm:
            history.confirm(confirm)
        if fetch:
            history.fetch(fetch)
        return history.recommend(exclude=exclude)

@endpoints.api(name="lunchere", version=LUNCHERE_API_VERSION, description="Where to lunch", allowed_client_ids=ALLOWED_CLIENT_IDS)
class LuncHereAPI(remote.Service):
    def __init__(self):
        self.counter = 0

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="today", http_method="GET")
    @require_login
    def today(self, request):
        recommendation = History.from_user(user=my_get_current_user()).recommend()
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayChoices, name="choices", http_method="GET")
    def choices_unauth(self, request):
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        choices = History.choices_from(request.historyId, request.timeslot)
        return choices.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="prevmealUnauth", http_method="GET")
    def prevmeal_unauth(self, request):
        "previous meal"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        recommendation =  History.recommend_from(request.historyId, request.timeslot, prevmeal=True)
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="nextmealUnauth", http_method="GET")
    def nextmeal_unauth(self, request):
        "next meal"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        recommendation =  History.recommend_from(request.historyId, request.timeslot, nextmeal=True)
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="deletemealUnauth", http_method="GET")
    def deletemeal_unauth(self, request):
        "delete meal, only when all the meals are not confirmed"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        recommendation = History.recommend_from(request.historyId, request.timeslot, deletemeal=True)
        return recommendation.to_rpc()

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="todayUnauth", http_method="GET")
    def today_unauth(self, request):
        "default call"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        recommendation = History.recommend_from(request.historyId, request.timeslot)
        return recommendation.to_rpc()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="noUnauth", http_method="GET")
    def no_unauth(self, request):
        "cancel/reject"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        logging.debug("request.name = %s; request.foursquare_id = %s" % (repr(request.name), repr(request.foursquare_id)))
        FoursquareVenue.set_4qr_id(request.historyId, request.name, request.foursquare_id)
        recommendation = History.recommend_from(request.historyId, request.timeslot, cancel=request.name)
        return recommendation.to_rpc()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="yesUnauth", http_method="GET")
    def yes_unauth(self, request):
        "confirm"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        FoursquareVenue.set_4qr_id(request.historyId, request.name, request.foursquare_id)
        recommendation = History.recommend_from(request.historyId, request.timeslot, confirm=request.name)
        return recommendation.to_rpc()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="fetchUnauth", http_method="GET")
    def fetch_unauth(self, request):
        "fetch"
        if Hints.get_hint(request.historyId, "blacklisted", None):
            return None
        self.counter += 1
        FoursquareVenue.set_4qr_id(request.historyId, request.name, request.foursquare_id)
        recommendation = History.recommend_from(request.historyId, request.timeslot, fetch=request.name)
        return recommendation.to_rpc()




# ==============
ENDPOINTS_APPLICATION = endpoints.api_server([LuncHereAPI], restricted=False)

# ================
import webapp2
from google.appengine.ext.webapp import template
class MainPage(webapp2.RequestHandler):
    """/ redirect to /t/RANDOM_STRING;
       /t/.* and /user/.* generate a page with some variable set according to current timeline/user;
       /logout clears cookie and redirect to /
       others redirect to /

       (maybe should change to:)

       / shows homepage
       /new redirect to /t/RANDOM_STRING;
       /t/.* and /user/.* generate a page with some variable set according to current timeline/user;
       /login requires user?
       /logout clears cookie and redirect to /
       others redirect to /
    """

    def _path_to_history_id(self, path):
        "generate History ID (XX:YY) from URL (/XX/YY)"
        if path.startswith("/user"):
            user = my_get_current_user(False)
            if user != None:
                return History.from_user(user).history_id
        elif path.startswith("/t/"):
            import re
            return re.compile("^/t/").sub("history:", path)
        else:
            return None

    def _cookie_to_history_id(self, request):
        logging.debug("_cookie_to_history_id")
        history_id = request.cookies.get("historyId", None)
        logging.debug("history_id = " + repr(history_id) + " (from cookies)")
        if history_id is not None:
            history_id = urllib.unquote(history_id)
            logging.debug("history_id = " + repr(history_id) + " (unquoted)")
        return history_id

    def set_root_cookie(self, history_id, days=7):
        seconds = days * 24 * 60 * 60
        expires = datetime.datetime.utcnow() + datetime.timedelta(days=days)
        self.response.set_cookie("historyId", urllib.quote(history_id), path="/", max_age=seconds, expires=expires, domain=None, secure=False, overwrite=True)
        pass

    def get(self):
        "default behavior"

        request, response = self.request, self.response
        # FIXME: maybe the http sometimes HTTP?
        if request.url.startswith("http://") and not request.url.startswith("http://localhost") :
            self.redirect(request.url.replace("http://", "https://")) # FIXME: this is wrong when the url itself contains http://
            return
        use_cookie = True
        refresh_cookie = True # refresh the cookie each time it is logged in
        # but in the following call, do not use_cookie, so that
        # the history_id is got from the user sent cookie directly rather
        # than in the client side.
        history_id = self._path_to_history_id(request.path)
        history_id_in_cookie = self._cookie_to_history_id(request)
        logging.debug("history_id from URL %s; history_id from cookie %s" % (repr(history_id), repr(history_id_in_cookie)))
        if history_id is not None:
            if Hints.get_hint(history_id, "blacklisted", None):
                path = os.path.join(os.path.dirname(__file__),
                                              'templates/blacklisted.html')
                params = {
                    'BLACKLISTED': Hints.get_hint(history_id, "blacklisted", ""),
                }
                self.response.set_status(503)
                response.headers['Content-Type'] = 'text/html'
                response.write(template.render(path, params))
                return
            if Hints.get_hint(history_id, "ll", None) is None:
                self.response.set_status(404)
                self.response.write("404 Not found")
                return

            response.headers['Content-Type'] = 'text/html'
            # response.headers['Cache-Control'] = 'no-cache'

            if use_cookie and (history_id != history_id_in_cookie or refresh_cookie):
                self.set_root_cookie(history_id)
            path = os.path.join(os.path.dirname(__file__),
                                          'templates/main.html')
            params = {
                'CLIENT_ID': CLIENT_ID_ALL_JS,
                'HISTORY_ID': history_id,
                'API_VERSION': LUNCHERE_API_VERSION,
                'LL': Hints.get_hint(history_id, "ll", ""), # FIXME: sometimes the datastore just cannot retrive the data that has been just put in
            }
            response.write(template.render(path, params))
        elif request.path == "/new":
            hints = {}
            if request.params.has_key("ll"):
                hints["ll"] = request.params["ll"]
            if request.params.has_key("near"):
                hints["near"] = request.params["near"]
            if len(hints) < 1:
                self.response.write("Hints = " + repr(hints))
            else:
                history_id = History.gen_new_history_id_from_hints(hints)
                if use_cookie:
                    self.set_root_cookie(history_id)
                if hints.get("ll", None):
                    Hints.set_hint(history_id, "ll", hints["ll"])
                if hints.get("near", None):
                    Hints.set_hint(history_id, "near", hints["near"])
                self.redirect(str(history_id).replace("history:", "/t/"))
        else:
            if request.path == "/" or request.path == "/logout":
                if use_cookie:
                    self.set_root_cookie("")
                self.redirect("/create")
            else:
                # self.redirect(str(history_id).replace("history:", "/history/"))
                self.response.set_status(404)
                self.response.write("404 Not found")


class LandingPage(webapp2.RequestHandler):
    def get(self):
        "Landing page"
        request, response = self.request, self.response
        if request.url.startswith("http://") and not request.url.startswith("http://localhost") :
            self.redirect(request.url.replace("http://", "https://")) # FIXME: this is wrong when the url itself contains http://
            return
        params = {}
        path = os.path.join(os.path.dirname(__file__), "templates/landing.html")
        response.write(template.render(path, params))
APPLICATION = webapp2.WSGIApplication([('/create', LandingPage), ('/.*', MainPage)], debug=True)

