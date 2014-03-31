from django.db import models

# Create your models here.
class shippers(models.Model):
    Company_Name = models.CharField(max_length=30)
    Executive_First_Name = models.CharField(max_length=50)
    Executive_Last_Name = models.CharField(max_length=60)
    Address = models.CharField(max_length=30, blank=True)
    City = models.CharField(max_length=50, blank=True)
    State = models.CharField(max_length=50, blank=True)
    ZIP_Code = models.CharField(max_length=50, blank=True)
    Credit_Score_Alpha = models.CharField(max_length=50, blank=True)
    Executive_Gender = models.CharField(max_length=50, blank=True)
    Executive_Title = models.CharField(max_length=50, blank=True)
    Fax_Number_Combined = models.CharField(max_length=50, blank=True)
    IUSA_Number = models.CharField(max_length=50, blank=True)
    Location_Employee_Size_Range = models.CharField(max_length=50, blank=True)
    Location_Sales_Volume_Range = models.CharField(max_length=50, blank=True)
    Phone_Number_Combined = models.CharField(max_length=50, blank=True)
    Primary_SIC_Code = models.CharField(max_length=50, blank=True)
    Primary_SIC_Description = models.CharField(max_length=50, blank=True)
    SIC_Code_2 = models.CharField(max_length=50, blank=True)
    SIC_Code_2_Description = models.CharField(max_length=50, blank=True)
    Verified_Record = models.CharField(max_length=50, blank=True)

# class Person(models.Model):
#     name = models.CharField(max_length=30, verbose_name="full name")

    def __unicode__(self):
        return u'%s %s' % (self.Company_Name, self.Executive_Last_Name)



