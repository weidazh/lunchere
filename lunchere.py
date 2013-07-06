from google.appengine.ext import endpoints
from google.appengine.api import users
from protorpc import remote
from protorpc import messages


# protorpc:  https://developers.google.com/appengine/docs/python/tools/protorpc/
class TestRequestResponseMsg(messages.Message):
    text = messages.StringField(1, required=False)
    user = messages.StringField(2, required=False)
    code = messages.IntegerField(3, required=False)

CLIENT_ID = 'TEST_HTML_CLIENT_ID'

ALLOWED_CLIENT_IDS = [CLIENT_ID, endpoints.API_EXPLORER_CLIENT_ID]


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

@endpoints.api(name="lunchere", version="dev", description="Where to lunch", allowed_client_ids=ALLOWED_CLIENT_IDS)
class LuncHereAPI(remote.Service):
    @endpoints.method(TestRequestResponseMsg, TestRequestResponseMsg, name="test", http_method="GET")
    def test(self, request):
        user = users.get_current_user()
        if user == None:
            # The URL could be (Python):  users.create_login_url(self.request.uri)
            # or (Javascript): ?? I use remote API instead.
            raise endpoints.UnauthorizedException(users.create_login_url("/"))
        return TestRequestResponseMsg(text="Test", user=repr(dir(endpoints)), code=400)

# ==============
endpoints_application = endpoints.api_server([OAuthAPI, LuncHereAPI], restricted=False)

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        self.response.write(open("test.html").read())

test = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

