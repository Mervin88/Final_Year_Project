import MySQLdb
import os

def get_db_name():
    return os.getenv('MYSQL_DB', 'eventsync')

def get_connection(with_db=True):
    import socket
    host = os.getenv('MYSQL_HOST', 'localhost')
    port = int(os.getenv('MYSQL_PORT', 3306))
    user = os.getenv('MYSQL_USER', 'root')
    passwd = os.getenv('MYSQL_PASSWORD', '')
    db = get_db_name() if with_db else None

    print(f"--> Attempting MySQL connection to: {host}:{port} (User: {user}, DB: {db})")

    # Diagnostic socket test
    if host != 'localhost' and host != '127.0.0.1':
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(5)
            s.connect((host, port))
            s.close()
            print(f"✓ TCP Socket test to {host}:{port} SUCCESSFUL!")
        except Exception as se:
            print(f"❌ TCP Socket test to {host}:{port} FAILED: {se}")

    kwargs = {
        'host': host,
        'port': port,
        'user': user,
        'passwd': passwd,
        'connect_timeout': 15
    }
    if with_db and db:
        kwargs['db'] = db

    try:
        return MySQLdb.connect(**kwargs)
    except Exception as e:
        if host != 'localhost' and host != '127.0.0.1':
            try:
                kwargs['ssl'] = {'ssl': {}}
                return MySQLdb.connect(**kwargs)
            except Exception:
                pass
        raise e

def cleanup_orphaned_tables():
    db_name = get_db_name()
    try:
        # Connect without database context first to drop and recreate database cleanly
        conn = get_connection(with_db=False)
        cur = conn.cursor()
        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cur.execute(f"DROP DATABASE IF EXISTS `{db_name}`;")
        cur.execute(f"CREATE DATABASE `{db_name}`;")
        cur.execute(f"USE `{db_name}`;")
        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.close()
        print(f"✓ Rebuilt clean database '{db_name}'")
    except Exception as e:
        print("Notice during database reset:", e)

def import_sql_file(filename):
    sql_file_path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(sql_file_path):
        print(f"Error: {sql_file_path} not found.")
        return False

    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    connection = get_connection(with_db=True)
    connection.autocommit(True)

    try:
        cursor = connection.cursor()
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        for stmt in statements:
            lines = [line for line in stmt.split('\n') if not line.strip().startswith('--')]
            clean_stmt = '\n'.join(lines).strip()
            if clean_stmt:
                try:
                    cursor.execute(clean_stmt)
                except Exception as ex:
                    print(f"Warning executing statement in {filename}: {ex}")
        return True
    except Exception as e:
        print(f"Error executing {filename}: {e}")
        return False
    finally:
        connection.close()

def main():
    print("Seeding EventSync database with full dataset...")
    
    # 0. Drop and recreate database to clear any stuck .ibd files
    cleanup_orphaned_tables()

    # 1. Import schema first
    if import_sql_file('schema.sql'):
        print("✓ Successfully imported schema.sql")

    # 2. Import venues dataset
    if import_sql_file('venues_dataset.sql'):
        print("✓ Successfully imported venues_dataset.sql")
    
    # 3. Import full dataset (users, events, registrations, notifications)
    if import_sql_file('full_dataset.sql'):
        print("✓ Successfully imported full_dataset.sql")
        
    # Print summary counts
    try:
        conn = get_connection(with_db=True)
        cur = conn.cursor()
        for table in ['users', 'venues', 'events', 'registrations', 'notifications']:
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            cnt = cur.fetchone()[0]
            print(f"  - Table '{table}': {cnt} records")
        conn.close()
    except Exception as e:
        print("Could not query summary table counts:", e)

if __name__ == '__main__':
    main()
