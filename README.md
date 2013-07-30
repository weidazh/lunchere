Lunchere is a web platform for users to pick where to have meals on Google App Engine.

It is observed that people such as high school students, college students and people who
commute to work often have lunch as a light social event with classmates or colleages.
People want simple, healthy, convenient, reasonable priced and delicious enough
food for lunch. While many people I know stick to the same Cha Chaan Teng for every lunch
to keep a penetrating life.
However, many people choose to lunch in different old places often while keep
trying new food occasionally so as to achieve food diversity.
In this case, it is not easy for one person or one group of people to select
where to eat, as some one must decide.

Lunchere is the tool for user to make the decision. It make suggestion based on user's
meal history. Occasionally it would suggest new food based on Lunchere's
learning engine (currently not implemented), or other location based services (such
as Foursquare). The user gives feedback by confirm or reselect the venue.

Lunchere means to be kept small so many data are saved in other services.

## Dependent Web Services

* Foursquare Venue API, is used for suggestions and detailed information about a venue
* Google Geocode API, is used in the landing page to decide the user lattitude and longtitude.
* Google Distance Matrix API, is used to calculate the distance of the venue and the user while
  the corresponding field of the foursquare data is missing. *This API restrict that the client should
  also only use the distance in showing Google Maps, this map should be added as soon as possible*

## Software Dependence

* Google App Engine (python dev-server 1.8.2)
    * google.appengine.ext.db (deprecated, should be replaced by ndb)
    * google.appengine.ext.endpoints (causing slow loading bugs, should be fixed or replaced by simple RESTful framework)
* phpcli (A simple templating just to include the version.txt)
* git and sh are required to generate version.txt
* less is used to compile css

## Installation and Deployment

        make 
        export PATH="$PATH:$GOOGLE_APP_ENGINE_PATH"
        ./deploy.sh # this deploys to dev, or
        # ./deploy.sh product # this deploys to product

