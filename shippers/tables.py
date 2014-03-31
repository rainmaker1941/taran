import django_tables2 as tables
from shippers.models import shippers

class shippersTable(tables.Table):
    class Meta:
        model = shippers
        # add class="paleblue" to <table> tag
        attrs = {"class": "paleblue"}