chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { postId, url } = request;
 
  getArticleDate(postId, url, sender.tab.id);

  // Close message channel
  sendResponse();
});

function getArticleDate(postId, url, tabId) {
  getArticleHtml(url).then(article => {
    const date = getDateFromHTML(article);

    // Publish date was successfully found, send to client script
    if (date) {
      chrome.tabs.sendMessage(tabId, { postId, date: formatDate(date) });
    }
  });
}

// Get all the HTML from the article page
const headers = new Headers();
headers.append('Content-Type', 'text/html');
headers.append('X-Requested-With', 'XmlHttpRequest');

function getArticleHtml(url) {
  url = 'https://cors-anywhere.herokuapp.com/' + url;
  const request = new Request(url, { headers, method: 'GET' });

  return fetch(request)
    .then(response => {
      // console.log(response.headers.get('Content-Size'));
      return response.text();
    })
    .then(html => {
      const htmlDocument = document.implementation.createHTMLDocument('parser');
      const article = htmlDocument.createElement('div');
      article.innerHTML = html;

      return article;
    });
}

function getDateFromHTML(article) {
  var publishDate = null;
  
  // Some websites include linked data with information about the article
  var linkedData = article.querySelector('script[type="application/ld+json"]');

  if (linkedData) {
    try {
      linkedData = JSON.parse(linkedData.innerHTML);
      publishDate = linkedData.datePublished || linkedData.dateCreated;
      
      if (publishDate) {
        return publishDate;
      }
    } catch {
      console.log('Invalid linkedData JSON')
    }
  }

  return publishDate;
}

function formatDate(date) {
  return (new Date(date)).strftime('%x');
}