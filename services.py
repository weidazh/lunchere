
from google.appengine.ext import endpoints

from lunchere import LuncHereAPI
endpoints_application = endpoints.api_server([LuncHereAPI], restricted=False)
