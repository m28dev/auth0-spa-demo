// auth0 lib config
const config = {
    domain: '<YOUR_AUTH0_DOMAIN>',
    client_id: '<YOUR_CLIENT_ID>',
    redirect_uri: 'http://localhost:8080/callback',
    useRefreshTokens: true,
    //cacheLocation: 'localstorage',
    audience: '<YOUR_AUDIENCE>'
};

/* Variables */
let auth0 = null;
const apiUri = 'http://localhost:3000';
const spaDemo = {};

/* Pages */
spaDemo.topView = async () => {
    const template = document.getElementById('top-page').content.cloneNode(true);
    const isAuthenticated = await auth0.isAuthenticated();

    // log-out button
    const logOutBtn = template.getElementById('btn-logout');
    logOutBtn.disabled = !isAuthenticated;
    logOutBtn.addEventListener('click', () => {
        auth0.logout({
            returnTo: window.location.origin
        });
    });

    // log-in button
    const logInBtn = template.getElementById('btn-login');
    logInBtn.disabled = isAuthenticated;
    logInBtn.addEventListener('click', async () => {
        await auth0.loginWithRedirect();
    });

    // private-page link
    template.getElementById('link-to-private').addEventListener('click', async e => {
        e.preventDefault();
        window.history.pushState({}, document.title, e.target.href);
        await showView();
    });

    return template;
};

spaDemo.cb = async () => {
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    }

    // redirect to '/'
    const link = document.createElement('a');
    link.href = '/';
    link.textContent = 'reload...';
    link.addEventListener('click', async e => {
        e.preventDefault();
        window.history.pushState({}, document.title, e.target.href);
        await showView();
    });

    const redirectScript = document.createElement('script');
    redirectScript.innerHTML = `document.getElementsByTagName('a')[0].click();`;

    const fragment = new DocumentFragment();
    fragment.appendChild(link);
    fragment.appendChild(redirectScript);

    return fragment;
};

spaDemo.privateView = async () => {
    const template = document.getElementById('private-page').content.cloneNode(true);

    try {
        const token = await auth0.getTokenSilently();

        const res = await fetch(`${apiUri}/api/message`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error("Error response:", res);
            throw new Error();
        }

        const resData = await res.json();
        template.getElementById('to').textContent = `userId: ${resData.to}`;
        template.getElementById('private-contents').textContent = `message: ${resData.message}`;

    } catch (err) {
        console.log(err);
    }

    template.getElementById('link-to-top').addEventListener('click', async e => {
        e.preventDefault();
        window.history.pushState({}, document.title, e.target.href);
        await showView();
    });

    return template;
};

/* Router */
const showView = async () => {
    const routes = {
        '/': spaDemo.topView,
        '/callback': spaDemo.cb,
        '/private': spaDemo.privateView
    };

    const request = window.location.pathname;
    const view = routes[request];

    if (view) {
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        container.appendChild(await view());
    }
}

/* Event listeners */
window.addEventListener('load', async () => {
    // auth0 init
    auth0 = await createAuth0Client({ ...config });
    // show page
    await showView();
});

window.addEventListener('popstate', async () => {
    await showView();
});
