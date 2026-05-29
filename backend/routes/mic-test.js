const express = require('express');
const router = express.Router();

// GET /api/mic-test - Returns HTML diagnostic page
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Microphone Diagnostic</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; }
    .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
    .ok { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    .test { margin: 20px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
    button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
    button:hover { background: #0056b3; }
    pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    .log { margin-top: 10px; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 5px; min-height: 100px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎤 Microphone Diagnostic Tool</h1>
    
    <h2>Browser/Device Info</h2>
    <div id="browser-info"></div>
    
    <h2>API Availability</h2>
    <div id="api-check"></div>
    
    <h2>Microphone Test</h2>
    <div class="test">
      <button onclick="testMicrophone()">🎤 Test Microphone Access</button>
      <div class="log" id="test-log"></div>
    </div>
    
    <h2>Troubleshooting</h2>
    <div id="troubleshoot"></div>
  </div>

  <script>
    function log(msg, type = 'info') {
      const logEl = document.getElementById('test-log');
      const time = new Date().toLocaleTimeString();
      logEl.innerHTML += \`<div>[\${time}] \${msg}</div>\`;
      logEl.scrollTop = logEl.scrollHeight;
    }

    function addStatus(containerId, title, ok, msg) {
      const el = document.getElementById(containerId);
      const status = document.createElement('div');
      status.className = 'status ' + (ok ? 'ok' : 'error');
      status.innerHTML = \`<strong>\${title}:</strong> \${msg}\`;
      el.appendChild(status);
    }

    function checkBrowser() {
      const ua = navigator.userAgent;
      const info = {
        'Browser': ua.substring(0, 100),
        'Location': window.location.origin,
        'Protocol': window.location.protocol,
        'Hostname': window.location.hostname,
        'IP Detection': /^(127\.|192\.168|10\.|172\.)/.test(window.location.hostname) ? 'Localhost/Private' : 'Remote IP'
      };
      
      let html = '';
      for (let [key, val] of Object.entries(info)) {
        html += \`<div class="status info"><strong>\${key}:</strong> \${val}</div>\`;
      }
      document.getElementById('browser-info').innerHTML = html;
    }

    function checkAPIs() {
      const apis = {
        'navigator.mediaDevices': !!navigator?.mediaDevices,
        'navigator.mediaDevices.getUserMedia': !!navigator?.mediaDevices?.getUserMedia,
        'navigator.mediaDevices.enumerateDevices': !!navigator?.mediaDevices?.enumerateDevices,
        'navigator.getUserMedia (old API)': !!navigator?.webkitGetUserMedia || !!navigator?.mozGetUserMedia || !!navigator?.getUserMedia,
        'MediaRecorder': typeof MediaRecorder !== 'undefined',
        'AudioContext': typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'
      };
      
      let html = '';
      for (let [key, avail] of Object.entries(apis)) {
        addStatus('api-check', key, avail, avail ? '✅ Available' : '❌ Not Available');
      }

      // Check for private/incognito mode
      checkPrivateMode();
    }

    function checkPrivateMode() {
      // Try to detect private/incognito mode
      let isPrivate = false;
      let reason = '';
      
      // IndexedDB test
      try {
        const test = indexedDB.open('test');
        test.onerror = () => {
          isPrivate = true;
          reason = 'IndexedDB blocked (likely private mode)';
        };
      } catch (e) {
        isPrivate = true;
        reason = 'IndexedDB error: ' + e.message;
      }

      // localStorage test
      try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
      } catch (e) {
        isPrivate = true;
        reason = 'localStorage blocked (likely private mode)';
      }

      if (isPrivate) {
        addStatus('api-check', 'Private/Incognito Mode', false, '⚠️ ENABLED - ' + reason);
      } else {
        addStatus('api-check', 'Private/Incognito Mode', true, '✅ Not detected');
      }
    }

    async function testMicrophone() {
      log('Starting microphone test...', 'info');
      const logEl = document.getElementById('test-log');
      logEl.innerHTML = '';
      
      try {
        log('1️⃣ Checking for getUserMedia API...', 'info');
        if (!navigator?.mediaDevices?.getUserMedia) {
          log('❌ getUserMedia not available', 'error');
          log('This browser cannot access microphone', 'error');
          updateTroubleshoot('api-missing');
          return;
        }
        log('✅ getUserMedia API available', 'ok');

        log('2️⃣ Requesting microphone access...', 'info');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        log('✅ Microphone access GRANTED', 'ok');
        log('3️⃣ Got audio stream with ' + stream.getAudioTracks().length + ' audio track(s)', 'ok');
        
        // Stop stream
        stream.getTracks().forEach(track => track.stop());
        log('✅ Stream stopped', 'ok');
        
        log('🎉 MICROPHONE WORKS! You can use voice messages.', 'ok');
        updateTroubleshoot('working');
      } catch (err) {
        log(\`❌ Error: \${err.name}\`, 'error');
        log(\`Message: \${err.message}\`, 'error');
        updateTroubleshoot(err.name);
      }
    }

    function updateTroubleshoot(errorType) {
      const el = document.getElementById('troubleshoot');
      let html = '';
      
      const solutions = {
        'NotAllowedError': \`
          <h3>🔒 Permission Denied</h3>
          <p>The browser didn't get permission to access microphone.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Reload this page (F5 atau Ctrl+R)</li>
            <li>When popup appears, click "Allow" or "Allow microphone"</li>
            <li>Test again</li>
          </ol>
          <p><em>If still blocked: Check browser settings for microphone permissions</em></p>
        \`,
        'NotFoundError': \`
          <h3>❌ No Microphone Found</h3>
          <p>Your device doesn't have a microphone, or it's not detected.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Check if your device has a microphone (check device specs)</li>
            <li>Try connecting an external microphone</li>
            <li>Restart your device</li>
            <li>Update audio drivers</li>
          </ol>
        \`,
        'AbortError': \`
          <h3>❌ Microphone In Use</h3>
          <p>Another app or browser tab is already using the microphone.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Close other apps (WhatsApp, Messenger, phone calls, etc)</li>
            <li>Close other browser tabs</li>
            <li>Close and reopen this browser</li>
            <li>Test again</li>
          </ol>
        \`,
        'NotSupportedError': \`
          <h3>❌ Browser Not Supported</h3>
          <p>Your browser doesn't support microphone access.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Try Chrome/Chromium</li>
            <li>Try Firefox</li>
            <li>Update your browser to latest version</li>
          </ol>
        \`,
        'PermissionDeniedError': \`
          <h3>🔒 Permission Denied (System Level)</h3>
          <p>Operating system denied microphone access to browser.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Go to Settings > Apps</li>
            <li>Find your browser (Chrome, Firefox, etc)</li>
            <li>Go to Permissions</li>
            <li>Enable "Microphone"</li>
            <li>Reload this page</li>
          </ol>
        \`,
        'api-missing': \`
          <h3>❌ API Not Available</h3>
          <p>Your browser is too old or doesn't support microphone access.</p>
          <strong>Solution:</strong>
          <ol>
            <li>Update your browser</li>
            <li>Try a different browser (Chrome recommended)</li>
            <li>Exit private/incognito mode if enabled</li>
          </ol>
        \`,
        'working': \`
          <div class="status ok">
            <h3>✅ Microphone Works!</h3>
            <p>Your device microphone is working properly. You can use voice messages in the chat app.</p>
          </div>
        \`
      };
      
      el.innerHTML = solutions[errorType] || \`<p>Unknown error type: \${errorType}</p>\`;
    }

    // Run checks on load
    window.addEventListener('load', () => {
      checkBrowser();
      checkAPIs();
    });
  </script>
</body>
</html>
  `);
});

module.exports = router;
