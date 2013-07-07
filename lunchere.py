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
    def __init__(self, name, historyId):
        self.name = name
        self.historyId = historyId

def get_recommendation(user=None):
    if user == None:
        historyId = gen_new_history_id()
    else:
        historyId = "user:" + user.user_id()
    import random
    return Recommendation(random.choice(["Cafe de Coral", "Fairwood", "Maxim"]), historyId=historyId)

def gen_new_history_id():
    from Crypto.Hash import MD5
    import random
    return "history:" + MD5.new(repr(random.randint(0, 100000))).hexdigest() # FIXME: user more robust algorithm

def valid_history_id(historyId):
    if historyId is None:
        return False
    elif historyId.startswith("history:"):
        return True
    elif historyId.startswith("user:"):
        return True
    else:
        return False

hashtable = {}
CHOICES = ["Cafe de Coral", "Fairwood", "Maxim", "Hua ren", "McDonald", "KFC", "Bang Bang Chicken", "Fairwood (Westwood)", "Yoshinoya", "Bijas", "Canada Restaurant"]
def get_timeslot():
    import time
    return "<" + str(time.time() / (24 * 3600)) + ">"
def get_recommendation_from_history(historyId, cancel=None, confirm=None):
    timeslot = get_timeslot()
    if cancel:
        if hashtable.has_key(timeslot + historyId):
            hashtable.pop(timeslot + historyId)
        pass # mark down the cancelling
    if confirm:
        hashtable[timeslot + historyId] = confirm
    if not valid_history_id(historyId):
        import random
        return Recommendation(random.choice(CHOICES), historyId=gen_new_history_id())
    elif hashtable.has_key(timeslot + historyId):
        return Recommendation(confirm, historyId=historyId)
    else:
        import random
        return Recommendation(random.choice(CHOICES), historyId=historyId)

@endpoints.api(name="lunchere", version="dev", description="Where to lunch", allowed_client_ids=ALLOWED_CLIENT_IDS)
class LuncHereAPI(remote.Service):
    @endpoints.method(TestRequestResponseMsg, TestRequestResponseMsg, name="test", http_method="GET")
    def test(self, request):
        return TestRequestResponseMsg(text="Test", user=repr(my_get_current_user(False)), code=400)

    @endpoints.method(NoneRequestMsg, TodayRecommendation, name="today", http_method="GET")
    @require_login
    def today(self, request):
        recommendation = get_recommendation(user=my_get_current_user())
        return TodayRecommendation(name=recommendation.name, historyId=recommendation.historyId)

    @endpoints.method(HistoryIdMsg, TodayRecommendation, name="todayUnauth", http_method="GET")
    def today_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId)
        return TodayRecommendation(name=recommendation.name, historyId=recommendation.historyId)

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="noUnauth", http_method="GET")
    def no_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, cancel=request.name)
        return TodayRecommendation(name=recommendation.name, historyId=recommendation.historyId)

    @endpoints.method(TodayRecommendation, TodayRecommendation, name="yesUnauth", http_method="GET")
    def yes_unauth(self, request):
        recommendation = get_recommendation_from_history(request.historyId, confirm=request.name)
        return TodayRecommendation(name=recommendation.name, historyId=recommendation.historyId)


# ==============
endpoints_application = endpoints.api_server([OAuthAPI, LuncHereAPI], restricted=False)

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        import logging
        if self.request.url.startswith("http://localhost:8080"):
            client_id = CLIENT_ID_localhost
        elif self.request.url.startswith("http://1.lunchere.appspot.com"):
            client_id = CLIENT_ID_http
        elif self.request.url.startswith("https://1-dot-lunchere.appspot.com"):
            client_id = CLIENT_ID_https
        self.response.write(open("test.html").read().replace("@@CLIENT_ID@@", client_id))

test = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

