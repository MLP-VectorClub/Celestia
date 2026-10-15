import { loginScript } from './login-script';
import { escapeHtml, htmlPage } from './page';
import type { HtmlPage } from './page';

/** A WordPress login, as bare as a login can be: the fields have WordPress's names so a script that knows them fills them in */
export const wordpressLogin = (siteName: string): HtmlPage =>
  htmlPage({
    title: `Log In ‹ ${siteName} — WordPress`,
    body: `<main>
<h1>${escapeHtml(siteName)}</h1>
<div id="login_error" role="alert" hidden></div>
<form name="loginform" id="loginform" action="/wp-login.php" method="post">
<p><label for="user_login">Username or Email Address</label><br><input type="text" name="log" id="user_login" autocomplete="username" required></p>
<p><label for="user_pass">Password</label><br><input type="password" name="pwd" id="user_pass" autocomplete="current-password" required></p>
<p><label><input name="rememberme" type="checkbox" id="rememberme" value="forever"> Remember Me</label></p>
<p><input type="submit" name="wp-submit" id="wp-submit" value="Log In"></p>
<input type="hidden" name="redirect_to" value="/wp-admin/">
<input type="hidden" name="testcookie" value="1">
</form>
<p><a href="/wp-login.php?action=lostpassword">Lost your password?</a></p>
<p><a href="/">← Go to ${escapeHtml(siteName)}</a></p>
</main>`,
    css: '#login_error{border-left:4px solid #d63638;background:#fff;padding:.5rem .75rem;margin-bottom:1rem}',
    script: loginScript({
      form: 'loginform',
      fields: ['user_login', 'user_pass'],
      error: 'login_error',
      message: "'Error: The password you entered for the username '+user+' is incorrect. Lost your password?'",
    }),
  });
