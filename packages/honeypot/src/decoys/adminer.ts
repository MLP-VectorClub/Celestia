import { loginScript } from './login-script';
import { htmlPage } from './page';
import type { HtmlPage } from './page';

/** Adminer's login: the server, user, password and database fields it has, in its order */
export const adminerLogin = (): HtmlPage =>
  htmlPage({
    title: 'Login - Adminer',
    body: `<main>
<h1><a href="https://www.adminer.org/" target="_blank" rel="noreferrer noopener">Adminer</a> <small>4.8.1</small></h1>
<p id="login-error" class="error" role="alert" hidden></p>
<form id="login" action="" method="post">
<p><label for="auth-driver">System</label><br>
<select name="auth[driver]" id="auth-driver"><option value="server" selected>MySQL / MariaDB</option><option value="pgsql">PostgreSQL</option><option value="sqlite">SQLite 3</option><option value="oracle">Oracle (beta)</option><option value="mssql">MS SQL</option></select></p>
<p><label for="auth-server">Server</label><br><input name="auth[server]" id="auth-server" value="localhost" autocapitalize="off"></p>
<p><label for="auth-username">Username</label><br><input name="auth[username]" id="auth-username" autofocus autocapitalize="off" autocomplete="username"></p>
<p><label for="auth-password">Password</label><br><input type="password" name="auth[password]" id="auth-password" autocomplete="current-password"></p>
<p><label for="auth-db">Database</label><br><input name="auth[db]" id="auth-db" autocapitalize="off"></p>
<p><label><input type="checkbox" name="auth[permanent]" value="1"> Permanent login</label></p>
<p><input type="submit" value="Login"></p>
</form>
</main>`,
    css: '.error{color:#c00}',
    script: loginScript({
      form: 'login',
      fields: ['auth-username', 'auth-password'],
      error: 'login-error',
      message: '"Access denied for user \'"+user+"\'@\'localhost\' (using password: YES)"',
    }),
  });
