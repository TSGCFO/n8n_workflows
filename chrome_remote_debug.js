// Using built-in fetch in Node.js 18+

async function connectToChrome() {
    try {
        // Get list of tabs
        const response = await fetch('http://localhost:9222/json');
        const tabs = await response.json();
        
        console.log('Connected to Chrome Debug Session');
        console.log('==========================================');
        console.log(`Chrome Version: Chrome/138.0.7204.51`);
        console.log(`Protocol Version: 1.3`);
        console.log(`Debug Port: 9222`);
        console.log(`WebSocket Debugger: ws://localhost:9222/devtools/browser/1a89e6b7-4edf-4d15-83f9-7eccbc6bf1c3`);
        console.log('');
        
        console.log('Active Tabs:');
        console.log('============');
        tabs.forEach((tab, index) => {
            console.log(`${index + 1}. ${tab.title}`);
            console.log(`   URL: ${tab.url}`);
            console.log(`   Type: ${tab.type}`);
            console.log(`   ID: ${tab.id}`);
            if (tab.parentId) {
                console.log(`   Parent ID: ${tab.parentId}`);
            }
            console.log(`   WebSocket: ${tab.webSocketDebuggerUrl}`);
            console.log('');
        });
        
        // Connect to the first main page (not iframe)
        const mainTabs = tabs.filter(tab => tab.type === 'page' && !tab.parentId);
        if (mainTabs.length > 0) {
            const activeTab = mainTabs[0];
            console.log(`Active main tab: ${activeTab.title}`);
            console.log(`URL: ${activeTab.url}`);
            
            // You can now use this WebSocket URL to send commands to the specific tab
            console.log(`Ready for remote debugging on: ${activeTab.webSocketDebuggerUrl}`);
        }
        
    } catch (error) {
        console.error('Error connecting to Chrome:', error.message);
    }
}

connectToChrome();