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

class TodayRecommendation(messages.Message):
    name = messages.StringField(1, required=True)
    historyId = messages.StringField(2, required=True)
    confirmed = messages.BooleanField(3, required=False)

CLIENT_ID_http      = '418397336121.apps.googleusercontent.com'
CLIENT_ID_https     = '418397336121-7u3gsnvbj6d5gan0102e83rb9gd4vd67.apps.googleusercontent.com'
CLIENT_ID_localhost = '418397336121-s6drlbeccaq3iopnslmf5i5gqcnlmda8.apps.googleusercontent.com'

ALLOWED_CLIENT_IDS = [CLIENT_ID_http, CLIENT_ID_https, CLIENT_ID_localhost, endpoints.API_EXPLORER_CLIENT_ID]


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
    def __init__(self, name, historyId, confirmed):
        self.name = name
        self.historyId = historyId
        self.confirmed = confirmed

    def toTodayRecommendation(self):
        return TodayRecommendation(name=self.name, historyId=self.historyId, confirmed=self.confirmed)

import datetime
from google.appengine.ext import db
class HistoryEvent(db.Model):
    historyId = db.StringProperty(required=True)
    timeslot = db.StringProperty(required=True)
    event_date = db.DateTimeProperty(required=True)
    # 4 cases: initilized, confirmed, cancelled, confirmed and cancelled
    confirmed = db.BooleanProperty()
    cancelled = db.BooleanProperty()
    canteenId = db.StringProperty(required=True)


class History:
    CHOICES = ["Cafe de Coral", "Fairwood", "Maxim", "Hua ren", "McDonald", "KFC", "Bang Bang Chicken", "Fairwood (Westwood)", "Yoshinoya", "Bijas", "Canada Restaurant"]
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

    def datastore_append(self, name, confirmed, cancelled):
        this_canteen_q = db.GqlQuery("SELECT * FROM HistoryEvent WHERE historyId = :1 AND timeslot = :2 AND canteenId = :3", self.historyId, self.timeslot, name)
        this_canteen = this_canteen_q.get()
        if this_canteen:
            he = this_canteen
            he.event_date = datetime.datetime.now()
            if cancelled:
                he.cancelled = cancelled
                # leave confirmed unchanged
            else:
                he.confirmed = confirmed
                he.cancelled = cancelled
            he.put()
        else:
            if confirmed and cancelled:
                import logging
                logging.warn("The event is confirmed and cancelled but cannot be found in datastore")
            he = HistoryEvent(historyId=self.historyId, timeslot=self.timeslot,
                        event_date=datetime.datetime.now(), confirmed=confirmed, cancelled=cancelled,
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

    @classmethod
    def get_timeslot(cls):
        import time
        return "<" + str(int(time.time() / (24 * 3600)) * 24 * 3600) + ">"

    def __init__(self, historyId=None):
        if not History.valid_history_id(historyId):
            historyId = History.gen_new_history_id()
        self.historyId = historyId
        self.timeslot = History.get_timeslot()
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

    def recommend(self):
        if self.next_recommend is None:
            import random
            self.confirmed = False
            self.next_recommend = random.choice(History.CHOICES)
            self.datastore_append(self.next_recommend, False, False)
        return Recommendation(self.next_recommend, historyId=self.historyId, confirmed=self.confirmed)


def get_recommendation_from_history(historyId, cancel=None, confirm=None):
    history = History(historyId)
    if cancel:
        history.cancel(cancel)
    if confirm:
        history.confirm(confirm)
    return history.recommend()

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

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="todayUnauth", http_method="GET")
    def today_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId)
        return recommendation.toTodayRecommendation()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="noUnauth", http_method="GET")
    def no_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, cancel=request.name)
        return recommendation.toTodayRecommendation()

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="yesUnauth", http_method="GET")
    def yes_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, confirm=request.name)
        return recommendation.toTodayRecommendation()


# ==============
endpoints_application = endpoints.api_server([OAuthAPI, LuncHereAPI], restricted=False)

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    def get_client_id(self):
        if self.request.url.startswith("http://localhost:8080"):
            return CLIENT_ID_localhost
        elif self.request.url.startswith("http://lunchere.appspot.com"):
            return CLIENT_ID_http
        elif self.request.url.startswith("https://1-dot-lunchere.appspot.com"):
            return CLIENT_ID_https
        else:
            return "Unknown"

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
                historyId = urllib.unquote(self.request.cookies.get("historyId", None))
            if historyId == None:
                historyId = History.gen_new_history_id()
                if useCookie:
                    import urllib
                    self.response.set_cookie("historyId", urllib.quote(historyId), max_age=7)
            self.redirect(str(historyId).replace("history:", "/history/"))

test = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

