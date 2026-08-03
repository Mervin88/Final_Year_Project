import MySQLdb
import os

def import_sql_file():
    sql_file_path = os.path.join(os.path.dirname(__file__), 'venues_dataset.sql')
    if not os.path.exists(sql_file_path):
        print(f"Error: {sql_file_path} not found.")
        return

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
            # Filter pure comment statements
            lines = [line for line in stmt.split('\n') if not line.strip().startswith('--')]
            clean_stmt = '\n'.join(lines).strip()
            if clean_stmt:
                cursor.execute(clean_stmt)
        
        cursor.execute("SELECT COUNT(*) FROM venues")
        count = cursor.fetchone()[0]
        print(f"Successfully imported! Total venues in database: {count}")
    finally:
        connection.close()

if __name__ == '__main__':
    import_sql_file()
