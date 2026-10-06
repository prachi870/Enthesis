# 🚀 AWS Deployment Guide for Enthesis

## 📋 Prerequisites

1. **AWS Account** - https://aws.amazon.com/free/
2. **AWS CLI** installed and configured
3. **EB CLI** installed
4. **Git** repository (✅ Already on GitHub)

---

## 🎯 Quick Start - Elastic Beanstalk Deployment

### **Step 1: Install AWS CLI**

**Windows:**
```powershell
# Download and install
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Verify
aws --version
```

**Configure:**
```powershell
aws configure
# AWS Access Key ID: [from IAM]
# AWS Secret Access Key: [from IAM]
# Default region: us-east-1
# Default output format: json
```

### **Step 2: Install EB CLI**

```powershell
pip install awsebcli
eb --version
```

### **Step 3: Initialize Elastic Beanstalk**

```powershell
cd "c:\Users\Prachi Singh\Downloads\Enthesis\enthesis"

# Initialize EB
eb init

# Select:
# Region: us-east-1 (or your choice)
# Application name: enthesis
# Platform: Python 3.11
# SSH: Yes (optional)
```

### **Step 4: Create Environment**

```powershell
# Create environment with load balancer
eb create enthesis-backend-env --instance-type t3.small

# Or with database
eb create enthesis-backend-env --instance-type t3.small --database
```

### **Step 5: Configure Environment Variables**

```powershell
# Generate secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Set environment variables
eb setenv SECRET_KEY="your-generated-key"
eb setenv DATABASE_URL="postgresql://user:pass@endpoint:5432/dbname"
eb setenv DEBUG="False"
eb setenv STORAGE_DIR="/tmp/storage"
```

### **Step 6: Deploy**

```powershell
# Deploy application
eb deploy

# Check status
eb status

# View logs
eb logs
```

---

## 🗄️ Set Up RDS Database

### **Option 1: Using EB (Recommended)**

```powershell
eb create --database
```

### **Option 2: Separate RDS Instance**

**Using AWS Console:**
1. Go to RDS → Create database
2. Select PostgreSQL 15
3. Choose template (Free tier for testing)
4. Set DB instance identifier: `enthesis-db`
5. Master username: `enthesis_admin`
6. Set master password (save it!)
7. Choose instance size: `db.t3.micro` (free tier)
8. Storage: 20 GB
9. Create database

**Using AWS CLI:**
```powershell
aws rds create-db-instance `
    --db-instance-identifier enthesis-db `
    --db-instance-class db.t3.micro `
    --engine postgres `
    --engine-version 15.3 `
    --master-username enthesis_admin `
    --master-user-password YourSecurePassword123! `
    --allocated-storage 20 `
    --publicly-accessible
```

**Get Endpoint:**
```powershell
aws rds describe-db-instances --db-instance-identifier enthesis-db --query "DBInstances[0].Endpoint.Address"
```

---

## 🌐 Deploy Frontend to S3 + CloudFront

### **Step 1: Create S3 Bucket**

```powershell
# Create bucket
aws s3 mb s3://enthesis-frontend-[your-unique-name]

# Configure for static website
aws s3 website s3://enthesis-frontend-[your-unique-name] `
    --index-document index.html `
    --error-document index.html
```

### **Step 2: Build and Upload Frontend**

```powershell
cd frontend

# Update environment
echo "VITE_API_URL=http://enthesis-backend-env.us-east-1.elasticbeanstalk.com" > .env.production

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://enthesis-frontend-[your-unique-name] --acl public-read
```

### **Step 3: Create CloudFront Distribution (Optional)**

**Using AWS Console:**
1. Go to CloudFront → Create Distribution
2. Origin domain: S3 bucket website endpoint
3. Default root object: `index.html`
4. Custom error response: 404 → /index.html (200)
5. Create distribution

---

## 🔒 Security Configuration

### **1. Update Security Groups**

```powershell
# Get security group ID
eb config

# Add rule to allow PostgreSQL from EB
aws ec2 authorize-security-group-ingress `
    --group-id [RDS_SECURITY_GROUP] `
    --protocol tcp `
    --port 5432 `
    --source-group [EB_SECURITY_GROUP]
```

### **2. Update CORS in Backend**

Edit `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://enthesis-frontend.s3-website-us-east-1.amazonaws.com",
        "https://your-cloudfront-domain.cloudfront.net"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **3. Enable HTTPS (SSL Certificate)**

```powershell
# Request certificate
aws acm request-certificate `
    --domain-name yourdomain.com `
    --validation-method DNS `
    --region us-east-1

# Add HTTPS listener to EB
eb config
# Add: aws:elbv2:listener:443
```

---

## 🔄 Continuous Deployment (GitHub Actions)

### **Step 1: Add Secrets to GitHub**

Go to GitHub repository → Settings → Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID` (if using)

### **Step 2: Push to Main Branch**

```powershell
git add .
git commit -m "Add AWS deployment configuration"
git push origin main
```

GitHub Actions will automatically deploy!

---

## 📊 Monitoring and Logs

### **View Logs:**
```powershell
eb logs
eb logs --all
```

### **Health Status:**
```powershell
eb health
eb status
```

### **SSH into Instance:**
```powershell
eb ssh
```

---

## 💰 Cost Estimate

### **Free Tier (First Year):**
- Elastic Beanstalk: Free (you pay for resources)
- EC2 t3.micro: 750 hours/month free
- RDS db.t3.micro: 750 hours/month free
- S3: 5 GB storage free
- **Total: $0-10/month**

### **Production:**
- EC2 t3.small: $15/month
- RDS db.t3.small: $30/month
- Load Balancer: $20/month
- S3 + CloudFront: $5-10/month
- Data transfer: $5-10/month
- **Total: $75-85/month**

---

## 🔧 Troubleshooting

### **Issue: Application won't start**
```powershell
# Check logs
eb logs --all

# Common fixes:
# 1. Verify Procfile
# 2. Check requirements.txt
# 3. Verify Python version in .python-version
```

### **Issue: Database connection failed**
```powershell
# Test connection
psql -h [RDS_ENDPOINT] -U enthesis_admin -d enthesis_db

# Check:
# 1. Security group allows connection
# 2. DATABASE_URL is correct
# 3. RDS is in same VPC as EB
```

### **Issue: 502 Bad Gateway**
```powershell
# Check:
# 1. Application is listening on correct port
# 2. Health check endpoint working
# 3. Nginx configuration correct
```

---

## 🎯 Quick Commands Reference

```powershell
# Deploy
eb deploy

# Check status
eb status
eb health

# View logs
eb logs
eb logs --all

# SSH into instance
eb ssh

# Environment variables
eb setenv KEY=VALUE
eb printenv

# Scale
eb scale 2

# Terminate environment
eb terminate enthesis-backend-env
```

---

## 📞 Support

If you need help:
1. Check EB logs: `eb logs`
2. Check CloudWatch logs in AWS Console
3. Verify security groups
4. Check database connectivity
5. Review environment variables

---

## ✅ Deployment Checklist

- [ ] AWS CLI installed and configured
- [ ] EB CLI installed
- [ ] Application initialized with `eb init`
- [ ] Environment created with `eb create`
- [ ] Database (RDS) created and configured
- [ ] Environment variables set
- [ ] Application deployed with `eb deploy`
- [ ] Frontend built and uploaded to S3
- [ ] CloudFront distribution created (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate added (optional)
- [ ] GitHub Actions configured
- [ ] Monitoring set up

---

**Your Enthesis application is now deployed on AWS! 🎉**
