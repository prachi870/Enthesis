# 🚀 Deploy Enthesis on Azure - Complete Guide

## 🎓 Get $100 FREE Azure Credits (Students)

### **Step 1: Sign Up for Azure for Students**
1. Go to: https://azure.microsoft.com/en-us/free/students/
2. Click **"Activate now"**
3. Sign in with your **.edu email** or verify student status
4. Get **$100 credits** instantly (no credit card required!)
5. Credits valid for **12 months**

---

## 🚀 Quick Deployment Steps

### **Method 1: Using Azure Portal (Easiest)**

#### **Step 1: Create Resource Group**
1. Go to: https://portal.azure.com/
2. Search: **"Resource groups"**
3. Click **"+ Create"**
4. Name: `enthesis-rg`
5. Region: **East US**
6. Click **"Review + create"**

#### **Step 2: Deploy Backend (App Service)**
1. Go to: https://portal.azure.com/#create/Microsoft.WebSite
2. **Basics:**
   - Resource Group: `enthesis-rg`
   - Name: `enthesis-backend` (must be unique globally)
   - Publish: **Code**
   - Runtime stack: **Python 3.11**
   - Operating System: **Linux**
   - Region: **East US**
   
3. **Pricing:**
   - Plan: **Basic B1** ($13/month, free with credits)
   - Or **Free F1** (limited resources, may not work well for ML)

4. Click **"Review + create"** → **"Create"**

#### **Step 3: Create Database (PostgreSQL)**
1. Go to: https://portal.azure.com/#create/Microsoft.PostgreSQLServer
2. **Basics:**
   - Resource Group: `enthesis-rg`
   - Server name: `enthesis-db` (must be unique)
   - Location: **East US**
   - Version: **15**
   - Compute + storage: **Basic, 1 vCore** ($26/month, free with credits)
   
3. **Authentication:**
   - Username: `enthesis_admin`
   - Password: [Your secure password]
   
4. **Networking:**
   - Allow Azure services: **Yes**
   - Add current IP: **Yes**

5. Click **"Review + create"** → **"Create"**

#### **Step 4: Deploy Code to App Service**

**Option A: Deploy from GitHub (Recommended)**
1. In Azure Portal, go to your App Service: `enthesis-backend`
2. Left menu → **Deployment Center**
3. Source: **GitHub**
4. Authorize GitHub
5. Select:
   - Organization: Your GitHub account
   - Repository: `Enthesis`
   - Branch: `main`
6. Click **"Save"**
7. Azure will auto-deploy from GitHub!

**Option B: Deploy using Azure CLI**
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login
az login

# Deploy
cd "c:\Users\Prachi Singh\Downloads\Enthesis\enthesis"
az webapp up --name enthesis-backend --resource-group enthesis-rg --runtime PYTHON:3.11
```

#### **Step 5: Configure Environment Variables**
1. In App Service, go to **Configuration** → **Application settings**
2. Add these variables:

```
DATABASE_URL = postgresql://enthesis_admin:YOUR_PASSWORD@enthesis-db.postgres.database.azure.com:5432/enthesis_db?sslmode=require

SECRET_KEY = your-secret-key-generated-with-openssl

DEBUG = False

WEBSITES_PORT = 8000

SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

3. Click **"Save"**
4. App will restart automatically

#### **Step 6: Deploy Frontend (Storage + Static Website)**
1. Go to: https://portal.azure.com/#create/Microsoft.StorageAccount
2. **Basics:**
   - Resource Group: `enthesis-rg`
   - Storage account name: `enthesisfrontend` (must be unique, lowercase)
   - Region: **East US**
   - Performance: **Standard**
   - Redundancy: **LRS** (cheapest)

3. Click **"Review + create"** → **"Create"**

4. **Enable Static Website:**
   - Go to storage account → **Static website**
   - Enable: **Enabled**
   - Index document: `index.html`
   - Error document: `index.html`
   - Click **"Save"**
   - Note the **Primary endpoint URL**

5. **Upload Frontend:**
```powershell
# Build frontend
cd frontend
npm run build

# Upload to Azure Storage (using Azure CLI)
az storage blob upload-batch --account-name enthesisfrontend --source dist --destination '$web'
```

---

## 💰 Azure Cost Breakdown (With $100 Credits)

| Service | Plan | Cost/Month | Free Credits Duration |
|---------|------|------------|----------------------|
| **App Service** | Basic B1 | $13 | ~7 months |
| **PostgreSQL** | Basic 1 vCore | $26 | ~3 months |
| **Storage** | Standard LRS | $1 | ~100 months |
| **Bandwidth** | First 100GB | $0 | Free |
| **Total** | | **$40/month** | **2.5 months FREE** |

**After $100 credits:** Pay ~$40/month or downgrade

---

## 🔧 Azure CLI Deployment (Advanced)

### **Install Azure CLI:**
```powershell
winget install Microsoft.AzureCLI
```

### **Login and Deploy:**
```powershell
# Login
az login

# Create resource group
az group create --name enthesis-rg --location eastus

# Create App Service Plan
az appservice plan create --name enthesis-plan --resource-group enthesis-rg --sku B1 --is-linux

# Create Web App
az webapp create --name enthesis-backend --resource-group enthesis-rg --plan enthesis-plan --runtime "PYTHON:3.11"

# Deploy code
cd "c:\Users\Prachi Singh\Downloads\Enthesis\enthesis"
az webapp up --name enthesis-backend --resource-group enthesis-rg

# Create PostgreSQL
az postgres server create --name enthesis-db --resource-group enthesis-rg --location eastus --admin-user enthesis_admin --admin-password YourSecurePass123! --sku-name B_Gen5_1

# Create database
az postgres db create --name enthesis_db --resource-group enthesis-rg --server-name enthesis-db

# Configure environment variables
az webapp config appsettings set --name enthesis-backend --resource-group enthesis-rg --settings DATABASE_URL="postgresql://enthesis_admin:YourSecurePass123!@enthesis-db.postgres.database.azure.com:5432/enthesis_db?sslmode=require" SECRET_KEY="your-secret-key" DEBUG="False"
```

---

## 📊 Monitor Your Spending

### **View Credits Balance:**
1. Go to: https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis
2. Check: **Cost analysis**
3. See: Remaining credits and spending

### **Set Budget Alerts:**
1. Go to: **Cost Management + Billing**
2. Click: **Budgets**
3. Create budget alert at $20, $50, $80

---

## 🔗 Important Azure Links

| Service | Link |
|---------|------|
| **Azure Portal** | https://portal.azure.com/ |
| **Student Signup** | https://azure.microsoft.com/en-us/free/students/ |
| **App Services** | https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2Fsites |
| **Databases** | https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.DBforPostgreSQL%2Fservers |
| **Storage Accounts** | https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Storage%2FStorageAccounts |
| **Cost Analysis** | https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis |

---

## ✅ Deployment Checklist

- [ ] Sign up for Azure for Students ($100 credits)
- [ ] Create Resource Group
- [ ] Deploy App Service (Backend)
- [ ] Create PostgreSQL Database
- [ ] Configure environment variables
- [ ] Deploy code from GitHub
- [ ] Create Storage Account (Frontend)
- [ ] Build and upload frontend
- [ ] Set up custom domain (optional)
- [ ] Configure SSL certificate
- [ ] Set budget alerts
- [ ] Test application

---

## 🆘 Troubleshooting

### **Issue: App won't start**
```powershell
# Check logs
az webapp log tail --name enthesis-backend --resource-group enthesis-rg

# Or in Portal: App Service → Log stream
```

### **Issue: Database connection failed**
1. Check firewall rules in PostgreSQL
2. Add your App Service's outbound IPs to allowed list
3. Verify connection string format

### **Issue: Out of memory**
- Upgrade to B2 plan (2 GB RAM)
- Or optimize ML models

---

## 🎯 Quick Start Commands

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Login
az login

# One-command deploy
cd "c:\Users\Prachi Singh\Downloads\Enthesis\enthesis"
az webapp up --name enthesis-backend-unique --resource-group enthesis-rg --runtime PYTHON:3.11 --sku B1

# Check status
az webapp show --name enthesis-backend-unique --resource-group enthesis-rg --query state

# View logs
az webapp log tail --name enthesis-backend-unique --resource-group enthesis-rg
```

---

**Your Enthesis app is now on Azure! 🎉**

**App URL:** https://enthesis-backend.azurewebsites.net
