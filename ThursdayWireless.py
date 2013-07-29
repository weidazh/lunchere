from lunchere import Timeline
from lunchere import TimeslotModel
from lunchere import HistoryEvent
from lunchere import FoursquareVenue
from lunchere import Hints
from google.appengine.ext import db
import datetime

def restore():
    x = [HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 13, 20, 318240),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 13, 0, 427430),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 40, 10, 517030),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 35, 11, 249730),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 34, 26, 662820),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 6, 44, 19, 300390),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 36, 45, 809790),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072401L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 24, 5, 3, 30, 720910),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013072001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 5, 43, 34, 947880),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 41, 236300),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 12, 56, 567290),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 5, 28, 55, 451450),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 22, 826860),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 17, 1, 53950),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013071501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 15, 3, 53, 46, 110660),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 27, 749950),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 5, 42, 29, 84460),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 3, 32, 138490),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 52, 561860),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013072701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 5, 51, 47, 336540),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013071801L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 18, 9, 26, 32, 91630),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 8, 0, 579970),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 56, 792460),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 32, 54230),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 25, 43, 177040),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 51, 839270),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 6, 45, 758900),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 10, 55, 5, 329090),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 17, 47, 720250),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 53, 717810),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 16, 52, 572490),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'cafe',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 7, 1, 724730),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Congee One \u58f9\u7ca5\u54c1',
	timeslot=2013072001L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 20, 5, 57, 15, 560070),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 18, 25, 711130),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 49, 495130),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Congee One \u58f9\u7ca5\u54c1',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 37, 485750),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 50, 53, 471520),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013071302L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 14, 5, 19, 30, 176660),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	timeslot=2013072701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 3, 44, 25, 901400),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 40, 12, 398200),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072601L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 26, 5, 8, 53, 515210),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'cafe',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 46, 809110),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013071201L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 12, 5, 25, 51, 5830),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 51, 172630),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 50, 56, 36730),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013072701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 5, 51, 56, 974600),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 51, 38400),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 16, 46, 83000),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 18, 23, 293640),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 3, 16, 364950),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013072301L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 23, 5, 23, 10, 134630),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 57, 231920),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013072201L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 22, 5, 35, 29, 402920),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Congee One \u58f9\u7ca5\u54c1',
	timeslot=2013072401L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 24, 5, 3, 14, 514440),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013072701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 5, 51, 51, 945170),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Caf\xe9 de Coral \u5927\u5bb6\u6a02',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 40, 8, 538400),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 16, 303070),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013072401L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 24, 5, 3, 22, 641350),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Caf\xe9 de Coral \u5927\u5bb6\u6a02',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 8, 3, 586750),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yuen Kee Dessert \u6e90\u8a18\u751c\u54c1\u5c08\u5bb6',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 16, 0, 291520),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013071901L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 19, 5, 53, 3, 978920),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 6, 53, 424150),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 1, 471160),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 42, 575650),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 7, 5, 706060),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 10, 54, 55, 515640),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013071302L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 13, 9, 29, 28, 732010),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 1, 49, 727720),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 52, 57, 874570),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5609\u8208\u9910\u5ef3',
	timeslot=2013072702L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 27, 12, 23, 22, 904040),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013072001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 5, 42, 14, 57800),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013071001L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 12, 5, 17, 55, 814740),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 1, 34, 809620),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'cafe',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 52, 55, 720750),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 50, 41, 450800),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 6, 44, 287730),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072401L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 24, 5, 3, 18, 54280),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 18, 20, 832630),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 55, 757990),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 18, 13, 83710),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013071401L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 14, 5, 18, 56, 579540),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 18, 12, 980870),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 49, 189810),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 38, 881530),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 6, 42, 456310),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 18, 17, 568880),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013070801L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 8, 5, 29, 26, 57110),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013071601L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 16, 8, 7, 10, 648490),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 10, 256510),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 7, 7, 162790),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 52, 52, 507210),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 50, 50, 439970),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013071601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 16, 8, 7, 8, 789220),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013071201L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 12, 5, 18, 27, 912030),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 5, 28, 22, 766060),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013071701L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 17, 5, 19, 40, 821350),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013071501L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 15, 4, 46, 34, 115870),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Boulangerie Bistronomique',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 8, 44, 589020),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 7, 22, 887340),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013071301L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 13, 5, 26, 26, 762290),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'cafe',
	timeslot=2013071701L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 17, 5, 1, 46, 778910),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013071901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 19, 5, 52, 57, 707740),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013071101L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 12, 5, 17, 59, 422440),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 10, 5, 54, 28, 808790),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013072001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 5, 43, 34, 830390),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 40, 14, 1450),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013072501L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 25, 7, 40, 18, 74690),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 34, 26, 415360),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 18, 49, 453460),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 34, 3, 246710),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 3, 29, 264090),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 34, 24, 537760),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 48, 548790),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'cafe',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 5, 27, 13820),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072301L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 23, 5, 23, 5, 124790),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072301L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 23, 5, 23, 2, 276800),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013070801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 8, 9, 24, 51, 415980),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013072002L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 22, 5, 34, 5, 610990),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'McDonalds',
	timeslot=2013072001L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 20, 5, 42, 23, 765460),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u82b3\u59d0\u4e0a\u6d77\u9910\u5385',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 43, 47390),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Congee One \u58f9\u7ca5\u54c1',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 8, 6, 764450),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 16, 57, 947590),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 25, 49, 991280),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 16, 41, 846400),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072601L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 26, 5, 8, 50, 295160),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 2, 11, 995660),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Fairwood at westwood',
	timeslot=2013071401L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 14, 5, 19, 40, 318510),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 3, 0, 647190),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 16, 49, 913110),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Caf\xe9 de Coral \u5927\u5bb6\u6a02',
	timeslot=2013072002L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 22, 5, 35, 7, 961890),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"Maxim's",
	timeslot=2013071801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 18, 5, 26, 5, 916210),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 3, 34, 834260),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 36, 50, 119800),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 5, 20, 318950),
    ),
    \
    HistoryEvent(
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Caf\xe9 de Coral \u5927\u5bb6\u6a02',
	timeslot=2013072701L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 27, 5, 52, 5, 283120),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u4eac\u5ddd\u996d\u5e97',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 5, 24, 80970),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Boulangerie Bistronomique',
	timeslot=2013072501L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 25, 7, 39, 56, 354040),
    ),
    \
    HistoryEvent(
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Boulangerie Bistronomique',
	timeslot=2013072702L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 27, 11, 1, 52, 150230),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072601'), 
	key_name=u'\u963f\u4e00',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013072601L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 29, 11, 2, 51, 578480),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072701'), 
	key_name=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013072701L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 28, 14, 29, 59, 220300),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072801'), 
	key_name=u'Congee One \u58f9\u7ca5\u54c1',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Congee One \u58f9\u7ca5\u54c1',
	timeslot=2013072801L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 28, 8, 59, 56, 672360),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072801'), 
	key_name=u"McDonald's \u9ea5\u7576\u52de",
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	timeslot=2013072801L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 28, 9, 0, 18, 329880),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'Boulangerie Bistronomique',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Boulangerie Bistronomique',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 19, 1, 854880),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'Canada Restaurant',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Canada Restaurant',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 18, 50, 818710),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Chui Yun Restaurant \u6f6e\u82d1\u9910\u5ef3',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 18, 26, 700890),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'Yoshinoya \u5409\u91ce\u5bb6',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 18, 32, 357590),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u516b\u65b9\u96f2\u96c6',
	confirmed=True,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	timeslot=2013072901L,
	cancelled=False,
	event_date=datetime.datetime(2013, 7, 29, 11, 2, 30, 673910),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5927\u5bb6\u4e50 (\u5546\u4e1a\u4e2d\u5fc3)',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 19, 13, 897410),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u5b9c\u52a0',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5b9c\u52a0',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 19, 13, 445040),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u5df4\u8700\u8f69',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u5df4\u8700\u8f69',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 18, 57, 74070),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u91d1\u534e\u4eba\u9910\u5385',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u91d1\u534e\u4eba\u9910\u5385',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 18, 38, 194700),
    ),
    \
    HistoryEvent(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless', u'Timeslot', u'2013072901'), 
	key_name=u'\u963f\u4e00',
	confirmed=False,
	historyId=u'history:ThursdayWireless',
	canteenId=u'\u963f\u4e00',
	timeslot=2013072901L,
	cancelled=True,
	event_date=datetime.datetime(2013, 7, 29, 5, 19, 8, 211510),
    ),
    \
    Hints(
	hint_key=u'll',
	historyId=u'history:ThursdayWireless',
	hint_value=u'22.28713,114.134428',
    ),
    \
    FoursquareVenue(
	canteenId=u'Yoshinoya \u5409\u91ce\u5bb6',
	foursquareId=u'4cfcc84620fe3704fd995bf8',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(
	canteenId=u'\u5609\u8208\u9910\u5ef3',
	foursquareId=u'51110cdfe4b0d12c3aab45b8',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(
	canteenId=u'Yuen Kee Dessert \u6e90\u8a18\u751c\u54c1\u5c08\u5bb6',
	foursquareId=u'4ba38fe3f964a5209a4738e3',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(
	canteenId=u'Boulangerie Bistronomique',
	foursquareId=u'505ac403e4b02caeb1d2fc8e',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'Bistronomique',
	canteenId=u'Bistronomique',
	foursquareId=u'4e2816861f6e88a1545e241c',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'Kwan Kee Claypot Rice \u5764\u8a18\u7172\u4ed4\u5c0f\u83dc',
	canteenId=u'Kwan Kee Claypot Rice \u5764\u8a18\u7172\u4ed4\u5c0f\u83dc',
	foursquareId=u'4b962c56f964a52057bf34e3',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u"McDonald's \u9ea5\u7576\u52de",
	canteenId=u"McDonald's \u9ea5\u7576\u52de",
	foursquareId=u'4bcbee0b68f976b029f66183',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'\u516b\u65b9\u96f2\u96c6',
	canteenId=u'\u516b\u65b9\u96f2\u96c6',
	foursquareId=u'4d23143edd6a236abfcd4c38',
	historyId=u'history:ThursdayWireless',
    ),
    \
    FoursquareVenue(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'\u5690\u56cd',
	canteenId=u'\u5690\u56cd',
	foursquareId=u'4ca85d03a6e08cfa2e628e94',
	historyId=u'history:ThursdayWireless',
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072601',
	mealname=u'Lunch',
	createdt=datetime.datetime(2013, 7, 26, 12, 0),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072601L,
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072701',
	mealname=u'Lunch',
	createdt=datetime.datetime(2013, 7, 27, 12, 0),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072701L,
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072702',
	mealname=u'Dinner',
	createdt=datetime.datetime(2013, 7, 27, 19, 0),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072702L,
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072801',
	mealname=u'Lunch',
	createdt=datetime.datetime(2013, 7, 28, 12, 0),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072801L,
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072901',
	mealname=u'Lunch',
	createdt=datetime.datetime(2013, 7, 29, 12, 0),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072901L,
    ),
    \
    TimeslotModel(parent=db.Key.from_path(u'Timeline', u'history:ThursdayWireless'), 
	key_name=u'2013072902',
	mealname=u'Dinner',
	createdt=datetime.datetime(2013, 7, 29, 11, 2, 30, 872880),
	historyId=u'history:ThursdayWireless',
	timeslot=2013072902L,
    )]
    for obj in x:
	obj.__dup__().put()
