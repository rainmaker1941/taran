from django.conf.urls import patterns, include, url
# from django.contrib.auth.views import login, logout
from django.contrib import admin
admin.autodiscover()
from taran import views

# from taran.views import hello
# from taran.views import search_form

urlpatterns = patterns('',
    # url(r'^hello/$', hello),
    # url(r'^accounts/login/$', login),
    url(r'^logout/$', views.logout),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^search-form/$', views.search_form),
    url(r'^login/$', views.login_user),
    url(r'^login_required/$', views.login_required),
    url(r'^register/$', views.register),
    url(r'^people/$', views.people),
    url(r'^index/$', views.index),
    (r'^search/$', views.search),
    (r'^polls/', include('polls.urls')),
    #(r'^polls/$', 'polls.views.index'),
    #(r'^polls/(?P<poll_id>\d+)/$', 'polls.views.detail'),
    #(r'^polls/(?P<poll_id>\d+)/results/$', 'polls.views.results'),
    #(r'^polls/(?P<poll_id>\d+)/vote/$', 'polls.views.vote'),
    # url(r'^/account/loggedin/$', views.loggedin),



    # Examples:
    # url(r'^$', 'taran.views.home', name='home'),
    # url(r'^taran/', include('taran.foo.urls')),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

)
