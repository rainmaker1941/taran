
from django.http import HttpResponse
from django.shortcuts import render
from shippers.models import shippers
import os.path
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.shortcuts import redirect
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib import auth




def hello(request):
    return HttpResponse(os.path.abspath(__file__).split('taran')[0]+'/templates')

def search_form(request):
    return render(request, 'search_form.html')

def search(request):
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

@csrf_exempt
def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect('/search-form/')
    else:
        form = UserCreationForm()
    return render(request, "registration/register.html", {
        'form': form,
    })

def login1(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            login(request, user)
            return redirect('search-form/')
        else:
            return redirect('search-form/') # Return a 'disabled account' error message
    else:
        return redirect('search-form/') # Return an 'invalid login' error message.


def logout1(request):
    logout(request)
    # Redirect to a success page.

def do_smth(request):
    if not request.user.is_authenticated():
        return redirect('/login/?next=%s' % request.path)

def do_smth2(request):
    if not request.user.is_authenticated():
        return render(request, 'myapp/login_error.html')

def loggedin(request):
    return HttpResponse(os.path.abspath(__file__).split('taran')[0]+'/templates/loggedin/')

def invalid(request):
    return HttpResponse(os.path.abspath(__file__).split('taran')[0]+'/templates/invalid/')