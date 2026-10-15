import { loginScript } from './login-script';
import { escapeHtml, htmlPage } from './page';
import type { HtmlPage } from './page';

/**
 * The look of wp-login.php, as far as bare elements and a bit of CSS go: the gray page, the narrow column, the white card with a thin border, big
 * inputs, the blue button. The logo is a circle with a letter in it, not WordPress's
 */
const WORDPRESS_CSS = `
body{display:block;max-width:none;margin:0;padding:0;background:#f0f0f1;color:#3c434a;font-size:13px;line-height:1.5}
#login{width:320px;max-width:100%;margin:0 auto;padding:8% 0 0}
#login h1{margin:0 0 24px;text-align:center;font-size:0}
#login h1 a{display:block;width:84px;height:84px;margin:0 auto;overflow:hidden;border-radius:50%;background:#3c434a;color:#fff;font-size:0;text-decoration:none}
#login h1 a::before{content:"W";display:block;font:bold 52px/84px Georgia,'Times New Roman',serif;text-align:center}
#login form{margin:20px 0 0;padding:26px 24px 34px;overflow:hidden;background:#fff;border:1px solid #c3c4c7;box-shadow:0 1px 3px rgba(0,0,0,.04)}
#login label{display:block;margin:0 0 3px;font-size:14px;color:#3c434a}
#login .forgetmenot label{display:inline;font-size:12px}
#login input[type=text],#login input[type=password]{box-sizing:border-box;width:100%;margin:2px 6px 16px 0;padding:3px 8px;font-size:24px;line-height:1.33;min-height:40px;color:#2c3338;background:#fff;border:1px solid #8c8f94;border-radius:4px;box-shadow:0 0 0 transparent}
#login input[type=text]:focus,#login input[type=password]:focus{border-color:#2271b1;box-shadow:0 0 0 1px #2271b1;outline:2px solid transparent}
#login .forgetmenot{float:left;margin:0 0 0;padding-top:7px}
#login .submit{float:right;margin:0}
#login #wp-submit{min-height:32px;margin:0;padding:0 12px;font-size:13px;line-height:2.15;color:#fff;background:#2271b1;border:1px solid #2271b1;border-radius:3px;cursor:pointer}
#login #wp-submit:hover{background:#135e96;border-color:#135e96}
#login #nav,#login #backtoblog{margin:24px 0 0;padding:0 24px;font-size:13px}
#login #backtoblog{margin-top:16px}
#login a{color:#50575e;text-decoration:underline}
#login a:hover{color:#135e96}
#login_error,#login_message{margin:20px 0 0;padding:12px;background:#fff;border:1px solid #c3c4c7;border-left-width:4px;box-shadow:0 1px 1px rgba(0,0,0,.04)}
#login_error{border-left-color:#d63638}
#login_message{border-left-color:#72aee6}
.wp-pwd{position:relative}
`;

const header = () => `<h1><a href="https://wordpress.org/">Powered by WordPress</a></h1>`;

/**
 * A WordPress login with what the real one has: the form posts to `wp-login.php`, the fields are `log`, `pwd`, `rememberme`, `wp-submit`, the hidden
 * `redirect_to` and `testcookie`, and the links under it are "Lost your password?" and "Go to <site>"
 */
export const wordpressLogin = (siteName: string): HtmlPage =>
  htmlPage({
    title: `Log In ‹ ${siteName} — WordPress`,
    bodyClass: 'login login-action-login wp-core-ui',
    body: `<div id="login">
${header()}
<div id="login_error" role="alert" hidden></div>
<form name="loginform" id="loginform" action="/wp-login.php" method="post">
<p>
<label for="user_login">Username or Email Address</label>
<input type="text" name="log" id="user_login" class="input" value="" size="20" autocapitalize="off" autocomplete="username" required="required">
</p>
<div class="user-pass-wrap">
<label for="user_pass">Password</label>
<div class="wp-pwd">
<input type="password" name="pwd" id="user_pass" class="input password-input" value="" size="20" autocomplete="current-password" spellcheck="false" required="required">
</div>
</div>
<p class="forgetmenot"><input name="rememberme" type="checkbox" id="rememberme" value="forever"> <label for="rememberme">Remember Me</label></p>
<p class="submit">
<input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Log In">
<input type="hidden" name="redirect_to" value="/wp-admin/">
<input type="hidden" name="testcookie" value="1">
</p>
</form>
<p id="nav"><a href="/wp-login.php?action=lostpassword">Lost your password?</a></p>
<p id="backtoblog"><a href="/">&larr; Go to ${escapeHtml(siteName)}</a></p>
</div>`,
    css: WORDPRESS_CSS,
    script: loginScript({
      form: 'loginform',
      fields: ['user_login', 'user_pass'],
      error: 'login_error',
      message: "'Error: The password you entered for the username '+user+' is incorrect. Lost your password?'",
    }),
  });

/** The `action`s of wp-login.php that lead to the form for a lost password (`lostyourpassword` is not WordPress's, but it is what people type) */
export const LOST_PASSWORD_ACTIONS = ['lostpassword', 'retrievepassword', 'lostyourpassword'];

/**
 * The lost password page of WordPress. Submitting does nothing but say that the reset link is on its way, whatever was typed: there is no server to
 * ask (the script stops the form from posting) and no mail to send
 */
export const wordpressLostPassword = (siteName: string): HtmlPage =>
  htmlPage({
    title: `Lost Password ‹ ${siteName} — WordPress`,
    bodyClass: 'login login-action-lostpassword wp-core-ui',
    body: `<div id="login">
${header()}
<div id="login_message" role="status" hidden></div>
<p class="message">Please enter your username or email address. You will receive an email message with instructions on how to reset your password.</p>
<form name="lostpasswordform" id="lostpasswordform" action="/wp-login.php?action=lostpassword" method="post">
<p>
<label for="user_login">Username or Email Address</label>
<input type="text" name="user_login" id="user_login" class="input" value="" size="20" autocapitalize="off" autocomplete="username" required="required">
</p>
<input type="hidden" name="redirect_to" value="">
<p class="submit">
<input type="submit" name="wp-submit" id="wp-submit" class="button button-primary button-large" value="Get New Password">
</p>
</form>
<p id="nav"><a href="/wp-login.php">Log in</a></p>
<p id="backtoblog"><a href="/">&larr; Go to ${escapeHtml(siteName)}</a></p>
</div>`,
    css: `${WORDPRESS_CSS}#login .message{margin:20px 0 0;padding:12px;background:#fff;border:1px solid #c3c4c7;border-left:4px solid #72aee6}`,
    script: `(function(){
var form=document.getElementById('lostpasswordform');
var box=document.getElementById('login_message');
if(!form)return;
form.addEventListener('submit',function(e){
e.preventDefault();
var button=form.querySelector('[type=submit]');
if(button)button.disabled=true;
setTimeout(function(){
box.textContent='Check your email for the confirmation link, then visit the login page.';
box.hidden=false;
form.hidden=true;
var intro=document.querySelector('#login .message');
if(intro)intro.hidden=true;
},700+Math.floor(Math.random()*600));
});
})();`,
  });
