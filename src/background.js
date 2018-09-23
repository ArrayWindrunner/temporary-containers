class TemporaryContainers {
  constructor() {
    this.initialized = false;

    this.storage = new window.Storage;
    this.utils = new window.Utils(this);
    this.runtime = new window.Runtime(this);
    this.management = new window.Management(this);
    this.request = new window.Request(this);
    this.container = new window.Container(this);
    this.mouseclick = new window.MouseClick(this);
    this.tabs = new window.Tabs(this);
    this.commands = new window.Commands(this);
    this.browseraction = new window.BrowserAction(this);
    this.pageaction = new window.PageAction(this);
    this.contextmenu = new window.ContextMenu(this);
    this.cookies = new window.Cookies(this);
    this.isolation = new window.Isolation(this);
    this.statistics = new window.Statistics(this);
    this.mac = new window.MultiAccountContainers(this);
    this.migration = new window.Migration(this);
  }


  async initialize() {
    // register message listener
    browser.runtime.onMessage.addListener(this.runtime.onMessage.bind(this));

    // TODO cache permissions in storage based on firefox version >=60.0b1
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1402850
    // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/getBrowserInfo
    this.permissions = {
      history: await browser.permissions.contains({permissions: ['history']}),
      notifications: await browser.permissions.contains({permissions: ['notifications']})
    };

    await this.storage.load();

    this.request.initialize();
    this.runtime.initialize();
    this.container.initialize();
    this.mouseclick.initialize();
    this.commands.initialize();
    this.browseraction.initialize();
    this.pageaction.initialize();
    this.contextmenu.initialize();
    this.cookies.initialize();
    this.statistics.initialize();
    this.mac.initialize();

    await this.management.initialize();
    await this.tabs.initialize();

    // Just slapped this ugly code on here to try an idea, I don't code in JS be waarned o/

    // Levanto handler del proxy
    var res = browser.proxy.onRequest.addListener((requestInfo) => {

      // Indago qué tab es la que está levantando el request
      var final_destination = browser.tabs.get(requestInfo.tabId).then((tabInfo) => {
        
          // Hay info de la tab, saquemos lista de containers y cotejemos el storage que usan
          return browser.contextualIdentities.query({}).then((identities) => {
            if (!identities.length) {
              console.log('No identities returned from the API. Should not happen D:');
              return {type: 'direct'};
            }

            // Ahora si, revisemos toda la lista
            for (let identity of identities) {
              if (identity.cookieStoreId === tabInfo.cookieStoreId) {          

                // Si es una temporary tab, pasarla por TOR
                if (identity.name.startsWith(this.storage.local.preferences.container.namePrefix)) {
                  console.log("[PROXIED] Url: " + requestInfo.url + " (tid:"+ requestInfo.tabId + ") | CONTAINER: " + identity.name + "| cookieStore: |" + identity.cookieStoreId+"|");
                  return {type: "socks", host: "127.0.0.1", port: 9050};
                } else {
                  // Otherwise, conexión normal
                  console.log("NOTPROXXIEd");
                  return {type: "direct"};
                }
                
              }
            }
         });
        });
    
      return final_destination;
    }, {urls: ['<all_urls>']});
    
    this.initialized = true;
  }
}

window.TemporaryContainers = TemporaryContainers;
window.tmp = new TemporaryContainers();
browser.runtime.onInstalled.addListener(tmp.runtime.onInstalled.bind(tmp));
browser.runtime.onStartup.addListener(tmp.runtime.onStartup.bind(tmp));

/* istanbul ignore next */
if (!browser._mochaTest) {
  tmp.initialize();
}
