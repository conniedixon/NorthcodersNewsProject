exports.up = function(knex) {
  console.log("Making the users table...");
  return knex.schema.createTable("users", usersTable => {
    usersTable.string("username").primary();
    usersTable.string("avatar_url");
    usersTable.string("name").notNullable();
  });
};

exports.down = function(knex) {
  console.log("Removing the users table...");
  return knex.schema.dropTable("users");
};