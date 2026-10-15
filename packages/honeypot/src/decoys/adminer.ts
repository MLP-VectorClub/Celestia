import { loginScript } from './login-script';
import { htmlPage } from './page';
import type { HtmlPage } from './page';

/** Adminer's own page: white, a blue heading, the form as a table with the labels on the left, a plain gray button */
const ADMINER_CSS = `
body{display:block;max-width:none;margin:0;padding:0;background:#fff;color:#000;font-size:90%;line-height:1.25}
#menu{float:left;box-sizing:border-box;width:20em;padding:.8em 1em;background:#f8f8f8;border-right:1px solid #ccc;min-height:100vh}
#menu h1{margin:0 0 .3em;font-size:150%;font-weight:bold}
#menu h1 a{color:#1f5c99;text-decoration:none}
#menu .version{color:#777;font-size:60%;font-weight:normal}
#content{margin-left:20em;padding:1em 2em}
#content h2{margin:0 0 .8em;font-size:150%;font-weight:bold;color:#000;border:0;padding:0}
form table.layout{width:auto;border-collapse:collapse;margin:0 0 1em;border:0}
form table.layout tr,form table.layout th,form table.layout td{background:none;border:0}
form table.layout th{padding:.3em 1em .3em 0;text-align:left;font-weight:normal;white-space:nowrap}
form table.layout td{padding:.3em 0}
form input:not([type=submit]):not([type=checkbox]):not([type=hidden]),form select{box-sizing:border-box;min-width:15em;margin:0;padding:.1em .3em;font-size:100%;color:#000;background:#fff;border:1px solid #999;border-radius:0}
form input[type=checkbox]{margin:0 .3em 0 0;vertical-align:middle}
form input[type=submit]{margin:0 .4em 0 0;padding:.2em .8em;font-size:100%;color:#000;background:#eee;border:1px solid #999;border-radius:0;cursor:pointer}
form label{display:inline;margin:0}
.error{margin:.5em 0 1em;padding:.5em .8em;color:#c00;background:#fee;border:1px solid #c00}
@media(max-width:700px){#menu{float:none;width:auto;min-height:0;border-right:0}#content{margin-left:0}}
`;

/**
 * Adminer's login: the left column with the name and version, then the form with the fields it has, named as it names them (`auth[driver]`,
 * `auth[server]`, `auth[username]`, `auth[password]`, `auth[db]`, `auth[permanent]`) and the hidden `token`. It posts to its own address
 */
export const adminerLogin = (token: string): HtmlPage =>
  htmlPage({
    title: 'Login - Adminer',
    body: `<div id="menu">
<h1><a href="https://www.adminer.org/" target="_blank" rel="noreferrer noopener" id="h1">Adminer</a> <span class="version">4.8.1</span></h1>
</div>
<div id="content">
<h2>Login</h2>
<div id="login-error" class="error" role="alert" hidden></div>
<form action="" method="post" id="login">
<table class="layout">
<tr><th>System</th><td><select name="auth[driver]"><option value="server" selected>MySQL / MariaDB</option><option value="sqlite">SQLite 3</option><option value="sqlite2">SQLite 2</option><option value="pgsql">PostgreSQL</option><option value="oracle">Oracle (beta)</option><option value="mssql">MS SQL</option><option value="mongo">MongoDB (alpha)</option><option value="elastic">Elasticsearch (beta)</option></select></td></tr>
<tr><th>Server</th><td><input name="auth[server]" value="localhost" title="hostname[:port]" placeholder="localhost" autocapitalize="off"></td></tr>
<tr><th>Username</th><td><input name="auth[username]" id="username" value="" autocomplete="username" autocapitalize="off" autofocus></td></tr>
<tr><th>Password</th><td><input type="password" name="auth[password]" id="password" autocomplete="current-password"></td></tr>
<tr><th>Database</th><td><input name="auth[db]" value="" autocapitalize="off"></td></tr>
</table>
<p><input type="submit" value="Login"> <label><input type="checkbox" name="auth[permanent]" value="1"> Permanent login</label></p>
<input type="hidden" name="token" value="${token}">
</form>
</div>`,
    css: ADMINER_CSS,
    script: loginScript({
      form: 'login',
      fields: ['username', 'password'],
      error: 'login-error',
      message: '"Access denied for user \'"+user+"\'@\'localhost\' (using password: YES)"',
    }),
  });
