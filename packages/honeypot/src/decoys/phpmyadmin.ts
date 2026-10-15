import { loginScript } from './login-script';
import { htmlPage } from './page';
import type { HtmlPage } from './page';

/** phpMyAdmin's login screen: a light gray page, a centered column, the form in a framed box with a legend, a "Go" button */
const PHPMYADMIN_CSS = `
body{display:block;max-width:none;margin:0;padding:0;background:#f3f3f3;color:#444;font-size:82%;line-height:1.4}
.container{width:30em;max-width:100%;margin:0 auto;padding:3em 1em;text-align:left}
.container h1{margin:0 0 .6em;font-size:140%;font-weight:normal;color:#235a81}
.container h1 bdo{font-weight:bold}
.logo{margin:0 0 1em;font-size:230%;font-weight:bold;letter-spacing:-.02em;color:#235a81}
.logo span{color:#f89406}
fieldset{margin:1em 0;padding:1em 1.4em;background:#fff;border:1px solid #aaa;border-radius:4px}
legend{padding:0 .5em;font-weight:bold;color:#444}
.item{margin:.8em 0}
.item label{display:inline-block;width:8em;font-weight:bold}
.item input:not([type=hidden]),.item select{box-sizing:border-box;display:inline-block;width:15em;max-width:100%;height:auto;min-height:1.9em;margin:0;padding:.2em .4em;font-size:100%;line-height:1.3;color:#000;background:#fff;border:1px solid #aaa;border-radius:2px;box-shadow:none}
fieldset.tblFooters{margin:0;padding:.6em 1.4em;text-align:right;background:#eee}
#input_go{padding:.3em 1.2em;font-size:100%;color:#fff;background:#235a81;border:1px solid #1d4a6a;border-radius:3px;cursor:pointer}
.alert-danger{margin:1em 0;padding:.8em 1em;color:#721c24;background:#f8d7da;border:1px solid #f5c6cb;border-radius:4px}
`;

/**
 * phpMyAdmin's login: it posts to `index.php?route=/` with `set_session`, `pma_username`, `pma_password`, `server`, `route` and `token`, the names the
 * real form has. The error it shows is the one a refused connection gives
 */
export const phpmyadminLogin = ({ token, session }: { token: string; session: string }): HtmlPage =>
  htmlPage({
    title: 'phpMyAdmin',
    body: `<div class="container">
<div class="logo">php<span>MyAdmin</span></div>
<h1>Welcome to <bdo dir="ltr" lang="en">phpMyAdmin</bdo></h1>
<div id="pma_errors" class="alert alert-danger" role="alert" hidden></div>
<form method="post" id="login_form" action="/phpmyadmin/index.php?route=/" name="login_form" class="disableAjax hide js-show">
<fieldset>
<legend>Log in</legend>
<div class="item">
<label for="sel-lang">Language</label>
<select name="lang" id="sel-lang"><option value="en" selected>English</option><option value="de">Deutsch</option><option value="hu">Magyar</option><option value="ru">Русский</option></select>
</div>
<div class="item">
<label for="input_username">Username:</label>
<input type="text" name="pma_username" id="input_username" value="" size="24" class="textfield" autocomplete="username" autofocus>
</div>
<div class="item">
<label for="input_password">Password:</label>
<input type="password" name="pma_password" id="input_password" value="" size="24" class="textfield" autocomplete="current-password">
</div>
<input type="hidden" name="server" value="1">
</fieldset>
<fieldset class="tblFooters">
<input type="hidden" name="set_session" value="${session}">
<input type="hidden" name="route" value="/">
<input type="hidden" name="token" value="${token}">
<input class="btn btn-primary" value="Go" type="submit" id="input_go">
</fieldset>
</form>
</div>`,
    css: PHPMYADMIN_CSS,
    script: loginScript({
      form: 'login_form',
      fields: ['input_username', 'input_password'],
      error: 'pma_errors',
      message: '"mysqli::real_connect(): (HY000/1045): Access denied for user \'"+user+"\'@\'localhost\' (using password: YES)"',
    }),
  });
