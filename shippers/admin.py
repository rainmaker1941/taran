from django.contrib import admin
from shippers.models import shippers

class ShipperAdmin(admin.ModelAdmin):
    list_display = ('Company_Name', 'Executive_Last_Name', 'Address',)
    search_fields = ('Company_Name', 'Address',)
    list_filter = ('Company_Name',)
    
admin.site.register(shippers,ShipperAdmin)