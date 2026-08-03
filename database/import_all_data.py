import MySQLdb
import os

def import_sql_file(filename):
    sql_file_path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(sql_file_path):
        print(f"Error: {sql_file_path} not found.")
        return False

    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    connection = MySQLdb.connect(
        host='localhost',
        user='root',
        passwd='',
        db='eventsync'
    )
    connection.autocommit(True)

    try:
        cursor = connection.cursor()
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        for stmt in statements:
            lines = [line for line in stmt.split('\n') if not line.strip().startswith('--')]
            clean_stmt = '\n'.join(lines).strip()
            if clean_stmt:
                cursor.execute(clean_stmt)
        return True
    except Exception as e:
        print(f"Error executing {filename}: {e}")
        return False
    finally:
        connection.close()

def main():
    print("Seeding EventSync database with full dataset...")
    
    # Import venues dataset
    if import_sql_file('venues_dataset.sql'):
        print("✓ Successfully imported venues_dataset.sql")
    
    # Import full dataset (users, events, registrations, notifications)
    if import_sql_file('full_dataset.sql'):
        print("✓ Successfully imported full_dataset.sql")
        
    # Print summary counts
    try:
        conn = MySQLdb.connect(host='localhost', user='root', passwd='', db='eventsync')
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
