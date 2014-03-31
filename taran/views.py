
from django.http import HttpResponse
from django.shortcuts import render
from shippers.models import shippers
from shippers.tables import shippersTable
import os.path
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout as logout_v
from django.shortcuts import redirect
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
# from django.views.decorators.csrf import csrf_protect
import django_tables2 as tables
from django_tables2 import RequestConfig
from django.db.models import Q


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            user = request.POST.get('username')
            return render_to_response('registration/user_added.html',{'user':user, 'username': 'username'})
    else:
        form = UserCreationForm()
    return render(request, "registration/register.html", {
        'form': form,
    })

def login_user(request):
    state = "Please log in below..."
    username = password = ''
    if request.POST:
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return render_to_response('registration/loggedin.html',{'user':username}) #state = "You're successfully logged in!"
            else:
                state = "Your account is not active, please contact the site admin."
        else:
            state = "Your username and/or password were incorrect."

    return render_to_response('registration/auth.html',{'state':state, 'username': username})

def logout(request):
    logout_v(request)
    return render_to_response('registration/loggedout.html') # Redirect to a success page.

def login_required(request):
        return render(request, 'registration/login_required.html')

def search_form(request):
    if not request.user.is_authenticated():
        return redirect('/login_required')
    else:
        return render(request, 'search_form.html')

#*******************************************************************************
#django_tables2

def people(request):
    table = shippersTable(shippers.objects.all())
    RequestConfig(request).configure(table)
    return render(request, 'people.html', {'table': table})

#*******************************************************************************

def search(request):
    is_zip = ('zip_code' in request.GET and request.GET['zip_code'])
    is_comp_name = ('comp_name' in request.GET and request.GET['comp_name'])
    is_state = ('state' in request.GET and request.GET['state'])
    if is_state or is_comp_name or is_zip:
        comp_name = request.GET['comp_name']
        zip_code = request.GET['zip_code']
        state = request.GET['state']
        shippers_new = shippers.objects.filter(Q(Company_Name__icontains=comp_name) & Q(ZIP_Code__icontains=zip_code) & Q(State__icontains=state))
        table = shippersTable(shippers_new)
        RequestConfig(request).configure(table)
        return render(request, 'people.html', {'table': table})
    else:
        table = shippersTable(shippers.objects.all())
        RequestConfig(request).configure(table)
        return render(request, 'people.html', {'table': table})

def index(request):
    query = 'yyyuuuyyu'
    table = shippersTable(shippers.objects.all())
    RequestConfig(request).configure(table)
    return render(request, 'index.html', {'query': query})

def do_smth(request):
    if not request.user.is_authenticated():
        return redirect('/login/?next=%s' % request.path)

def do_smth2(request):
    if not request.user.is_authenticated():
        return render(request, 'myapp/login_error.html')

def loggedin(request):
    return HttpResponse(os.path.abspath(__file__).split('taran')[0]+'/templates/loggedin/')

def hello(request):
    return HttpResponse(os.path.dirname(__file__))

def search1(request):
    errors = []
    if 'q' in request.GET:
        q = request.GET['q']
        if not q:
            errors.append('Enter a search term.')
        elif len(q) > 20:
            errors.append('Please enter at most 20 characters.')
        else:
            shipper = shippers.objects.filter(Company_Name__icontains=q)
            return render(request, 'search_results.html',
            {'shippers': shipper, 'query': q})
    return render(request, 'search_form.html', {'errors': errors})
