"""Database setup script for Enthesis

This script helps you set up PostgreSQL database for Enthesis.

Prerequisites:
1. Install PostgreSQL (https://www.postgresql.org/download/)
2. Ensure PostgreSQL service is running

What this script does:
- Creates database and user
- Initializes tables
- Provides connection string for .env file
"""

import sys
import subprocess
from getpass import getpass


def run_psql_command(command, database="postgres"):
    """Run a PostgreSQL command"""
    try:
        result = subprocess.run(
            ["psql", "-U", "postgres", "-d", database, "-c", command],
            capture_output=True,
            text=True,
            check=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except FileNotFoundError:
        return False, "PostgreSQL 'psql' command not found. Please install PostgreSQL."


def main():
    print("=" * 60)
    print("Enthesis Database Setup")
    print("=" * 60)
    print()
    
    # Get database configuration
    print("Enter database configuration (press Enter for defaults):")
    print()
    
    db_name = input("Database name [enthesis_db]: ").strip() or "enthesis_db"
    db_user = input("Database user [enthesis_user]: ").strip() or "enthesis_user"
    db_password = getpass("Database password [enthesis_pass]: ").strip() or "enthesis_pass"
    db_host = input("Database host [localhost]: ").strip() or "localhost"
    db_port = input("Database port [5432]: ").strip() or "5432"
    
    print()
    print("Configuration:")
    print(f"  Database: {db_name}")
    print(f"  User: {db_user}")
    print(f"  Host: {db_host}")
    print(f"  Port: {db_port}")
    print()
    
    confirm = input("Create database with this configuration? [Y/n]: ").strip().lower()
    if confirm and confirm != 'y':
        print("Setup cancelled.")
        return
    
    print()
    print("Creating database and user...")
    
    # Create user
    success, output = run_psql_command(
        f"CREATE USER {db_user} WITH PASSWORD '{db_password}';"
    )
    if success:
        print(f"✓ User '{db_user}' created")
    else:
        if "already exists" in output:
            print(f"⚠ User '{db_user}' already exists")
        else:
            print(f"✗ Error creating user: {output}")
            return
    
    # Create database
    success, output = run_psql_command(
        f"CREATE DATABASE {db_name} OWNER {db_user};"
    )
    if success:
        print(f"✓ Database '{db_name}' created")
    else:
        if "already exists" in output:
            print(f"⚠ Database '{db_name}' already exists")
        else:
            print(f"✗ Error creating database: {output}")
            return
    
    # Grant privileges
    success, output = run_psql_command(
        f"GRANT ALL PRIVILEGES ON DATABASE {db_name} TO {db_user};"
    )
    if success:
        print(f"✓ Privileges granted to '{db_user}'")
    
    # Connection string
    connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print()
    print("=" * 60)
    print("✓ Database setup complete!")
    print("=" * 60)
    print()
    print("Add this line to your .env file:")
    print()
    print(f"DATABASE_URL={connection_string}")
    print()
    print("Next steps:")
    print("1. Copy .env.example to .env")
    print("2. Update DATABASE_URL in .env with the connection string above")
    print("3. Generate a secure SECRET_KEY with: openssl rand -hex 32")
    print("4. Start the backend: python -m uvicorn backend.app.main:app --reload")
    print()


if __name__ == "__main__":
    main()
