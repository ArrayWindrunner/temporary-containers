class TemporaryProxy {
  constructor(background) {
    this.background = background;
  }

  async initialize() {
    this.storage = this.background.storage;
    this.container = this.background.container;
    this.mouseclick = this.background.mouseclick;
    this.browseraction = this.background.browseraction;
    this.mac = this.background.mac;
    this.utils = this.background.utils;
    this.tabs = this.background.tabs;
    this.isolation = this.background.isolation;
    this.management = this.background.management;

    if (this.storage.local.preferences.proxyTemporaryTabs) {

      // Just slapped this ugly code on here to try an idea, I don't code in JS be waarned o/
      
      //Levanto handler del proxy
      var res = browser.proxy.onRequest.addListener((requestInfo) => {

        // Indago qué tab es la que está levantando el request
        var final_destination = browser.tabs.get(requestInfo.tabId).then((tabInfo) => {

              // Hay info de la tab, saquemos lista de containers y cotejemos el
              // storage que usan
              return browser.contextualIdentities.query({}).then((identities) => {
                
                if (!identities.length) {
                  console.log('No identities returned from the API. Should not happen D:');
                  return {type: 'direct'};
                }

                // Ahora si, revisemos toda la lista
                for (let identity of identities) {
                  if (identity.cookieStoreId === tabInfo.cookieStoreId) {
                    // Si es una temporary tab, pasarla por TOR
                    if (identity.name.startsWith(this.storage.local.preferences
                                                     .container.namePrefix)) {
                      console.log(
                          '[PROXIED] Url: ' + requestInfo.url + ' (tid:' + requestInfo.tabId +
                          ') | CONTAINER: ' + identity.name + '| cookieStore: |' + identity.cookieStoreId + '|');
                      return {
                        type: this.storage.local.preferences.proxyType,
                        host: this.storage.local.preferences.proxyHost,
                        port: this.storage.local.preferences.proxyPort
                      };
                    } else {
                      // Otherwise, conexión normal
                      console.log('[NOTPROXXIEd] ' +  requestInfo.url);
                      return {type: 'direct'};
                    }
                  }
                }
              });
            });

        return final_destination;
      }, {urls: ['<all_urls>']});
    }
  }
}

window.TemporaryProxy = TemporaryProxy;
