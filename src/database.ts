import Gda5 from 'gi://Gda?version=5.0';

export function connectToDb() {
  const connection = new Gda5.Connection({
    provider: Gda5.Config.get_provider('SQLite'),
    cncString: `DB_DIR=/home/exposedcat/data;DB_NAME=focusmode`,
  });

  connection.open();

  connection.execute_non_select_command(`
    CREATE TABLE IF NOT EXISTS window (
      id      TEXT NOT NULL PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 0
    );
  `);

  return connection;
}

export function disconnectFromDb(connection: Gda5.Connection) {
  connection.close();
}

export function setWindowEnabled(connection: Gda5.Connection, id: string, enabled: boolean) {
  const builder = new Gda5.SqlBuilder({
    stmt_type: Gda5.SqlStatementType.UPDATE,
  });

  builder.set_table('window');
  builder.add_field_value_as_gvalue('enabled', Number(enabled) as any);
  builder.set_where(
    builder.add_cond(
      Gda5.SqlOperatorType.EQ,
      builder.add_field_id('id', null),
      builder.add_expr_value(null, id as any),
      0,
    ),
  );

  connection.statement_execute_non_select(builder.get_statement(), null);
}

export function createWindow(connection: Gda5.Connection, id: string, enabled: boolean) {
  const builder = new Gda5.SqlBuilder({
    stmt_type: Gda5.SqlStatementType.INSERT,
  });

  builder.set_table('window');
  builder.add_field_value_as_gvalue('id', id as any);
  builder.add_field_value_as_gvalue('enabled', Number(enabled) as any);

  connection.statement_execute_non_select(builder.get_statement(), null);
}

export function getEnabledWindows(connection: Gda5.Connection) {
  const builder = new Gda5.SqlBuilder({
    stmt_type: Gda5.SqlStatementType.SELECT,
  });

  builder.select_add_target('window', 'window');
  builder.select_add_field('id', 'window', 'id');
  builder.select_add_field('enabled', 'window', 'enabled');

  const request = connection.statement_execute_select(builder.get_statement(), null);

  const iterator = request.create_iter();
  const windows: { id: string; enabled: boolean }[] = [];
  while (iterator.move_next()) {
    const id = iterator.get_value_for_field('id');
    const enabled = iterator.get_value_for_field('enabled');
    windows.push({
      id: id as any, // TODO: type
      enabled: Boolean(enabled as any),
    });
  }

  return windows;
}
