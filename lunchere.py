from google.appengine.ext import endpoints
from protorpc import remote
from protorpc import messages


# protorpc:  https://developers.google.com/appengine/docs/python/tools/protorpc/
class TestRequestResponseMsg(messages.Message):
    text = messages.StringField(1, required=False)

CLIENT_ID = 'TEST_HTML_CLIENT_ID'

@endpoints.api(name="lunchere", version="dev", description="Where to lunch", allowed_client_ids=[CLIENT_ID, endpoints.API_EXPLORER_CLIENT_ID])
class LuncHereAPI(remote.Service):
    @endpoints.method(TestRequestResponseMsg, TestRequestResponseMsg, name="test", http_method="GET")
    def test(self, request):
        return TestRequestResponseMsg(text="Test")

# ================
import webapp2
class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/html'
        self.response.write(open("test.html").read())

test = webapp2.WSGIApplication([('/.*', MainPage)], debug=True)

