class AITerminal {
    constructor() {
        this.welcomeOverlay = document.getElementById('welcome-overlay');
        this.terminalContainer = document.getElementById('terminal-container');
        this.statusBar = document.getElementById('status-bar');
        this.startButton = document.getElementById('start-button');
        
        this.terminalContent = document.getElementById('terminal-content');
        this.commandInput = document.getElementById('command-input');
        this.compilerStatus = document.querySelector('.status-item:nth-child(2) .status-value');
        this.interpreterStatus = document.querySelector('.status-item:nth-child(3) .status-value');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        
        // Console elements
        this.consoleOutput = document.getElementById('console-output');
        this.consoleInput = document.getElementById('console-input');
        this.consoleInputArea = document.getElementById('console-input-area');
        this.clearConsoleBtn = document.getElementById('clear-console');
        this.pauseConsoleBtn = document.getElementById('pause-console');
        this.stopConsoleBtn = document.getElementById('stop-console');
        this.downloadInterpreterBtn = document.getElementById('download-interpreter');
        this.codeEditor = document.getElementById('code-editor');
        this.insertExampleBtn = document.getElementById('insert-example');
        this.runCodeBtn = document.getElementById('run-code');
        
        // Output panel elements
        this.outputPanel = document.getElementById('output-panel');
        this.outputResults = document.getElementById('output-results');
        this.outputVariables = document.getElementById('output-variables');
        this.outputFunctions = document.getElementById('output-functions');
        this.clearOutputsBtn = document.getElementById('clear-outputs');
        this.closeOutputsBtn = document.getElementById('close-outputs');
        this.mainContent = document.querySelector('.main-content');
        
        this.isProcessing = false;
        this.currentProgram = null;
        this.programState = null;
        this.terminalInitialized = false;
        this.activeTab = 'main';
        this.consolePaused = false;
        this.consoleStopped = false;
        
        this.setupEventListeners();
        this.setupWelcomeFlow();
    }

    setupEventListeners() {
        // Start button event listener
        this.startButton.addEventListener('click', () => {
            this.startTerminal();
        });

        // Tab switching
        this.setupTabListeners();
        
        // Console controls
        this.setupConsoleListeners();

        // Terminal event listeners (only set up after terminal is shown)
        this.setupTerminalEventListeners();
    }

    setupTabListeners() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    this.closeTab(tab);
                } else {
                    this.switchTab(tab.dataset.tab);
                }
            });
        });

        // Tab add button
        document.querySelector('.tab-add').addEventListener('click', () => {
            this.addNewTab();
        });
    }

    setupConsoleListeners() {
        this.clearConsoleBtn.addEventListener('click', () => {
            this.clearConsole();
        });

        this.pauseConsoleBtn.addEventListener('click', () => {
            this.toggleConsolePause();
        });

        this.stopConsoleBtn.addEventListener('click', () => {
            this.stopConsole();
        });

        this.downloadInterpreterBtn.addEventListener('click', () => {
            this.downloadInterpreter();
        });

        // Code editor helpers
        this.insertExampleBtn.addEventListener('click', () => {
            if (this.currentProgram?.config?.functions?.length) {
                this.populateExampleFromFunctions(this.currentProgram.config.functions, this.currentProgram.config.domain || 'general');
            } else {
                this.insertExampleCode();
            }
        });
        this.runCodeBtn.addEventListener('click', () => {
            this.runExampleCode();
        });

        this.consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConsoleInput();
            }
        });

        // Output panel controls
        this.clearOutputsBtn.addEventListener('click', () => {
            this.clearOutputs();
        });

        this.closeOutputsBtn.addEventListener('click', () => {
            this.closeOutputPanel();
        });
    }

    setupTerminalEventListeners() {
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isProcessing) {
                this.processCommand();
            }
        });

        // Focus input on click anywhere in terminal
        this.terminalContent.addEventListener('click', () => {
            this.commandInput.focus();
        });
    }

    downloadInterpreter() {
        try {
            const backend = this.currentProgram?.backend;
            // Try to infer interpreter content from backend fields used in dedalus: likely 'inthpp'
            const content = backend?.inthpp || backend?.int || backend?.interpreter || '';
            if (!content) {
                this.addConsoleLine('No interpreter available. Generate a program first.', 'error');
                return;
            }
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'int.hpp';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            this.addConsoleLine('Failed to download interpreter.', 'error');
        }
    }

    insertExampleCode() {
        const example = `print("hello")`;
        this.codeEditor.value = example;
    }

    async runExampleCode() {
        const code = (this.codeEditor?.value || '').trim();
        if (!code) {
            this.addConsoleLine('No code to run. Add example or type code.', 'error');
            return;
        }
        try {
            this.addConsoleLine('Sending code to runner...', 'info');
            const res = await fetch('/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ example: code })
            });
            if (!res.ok) throw new Error(`Runner returned ${res.status}`);
            const data = await res.json();
            const output = data.output || '';
            if (output) {
                output.split('\n').forEach(line => {
                    if (line.trim().length > 0) this.addConsoleLine(line, 'interpreter');
                });
            } else {
                this.addConsoleLine('No stdout.', 'info');
            }
            if (data.error) {
                data.error.split('\n').forEach(line => {
                    if (line.trim().length > 0) this.addConsoleLine(line, 'error');
                });
            }
            if (typeof data.returncode === 'number') {
                this.addConsoleLine(`Process exited with code ${data.returncode}`, data.returncode === 0 ? 'info' : 'error');
            }
        } catch (err) {
            this.addConsoleLine(`Error running code: ${err.message}`, 'error');
        }
    }

    setupWelcomeFlow() {
        // Add some dynamic effects to the welcome screen
        this.animateWelcomeText();
    }

    animateWelcomeText() {
        const title = document.querySelector('.welcome-header h1');
        const exampleBox = document.querySelector('.example-box');
        
        // Animate title
        setTimeout(() => {
            title.style.animation = 'slideDown 0.8s ease-out';
        }, 200);

        // Animate example box
        setTimeout(() => {
            exampleBox.style.animation = 'fadeIn 1s ease-in';
        }, 800);
    }

    startTerminal() {
        // Hide welcome overlay with animation
        this.welcomeOverlay.classList.add('hidden');
        
        // Show terminal after animation completes
        setTimeout(() => {
            this.welcomeOverlay.style.display = 'none';
            this.terminalContainer.style.display = 'flex';
            this.statusBar.style.display = 'flex';
            
            // Initialize terminal
            this.initializeTerminal();
        }, 600);
    }

    initializeTerminal() {
        if (this.terminalInitialized) return;
        
        this.terminalInitialized = true;
        this.addWelcomeMessage();
        
        // Focus the input
        setTimeout(() => {
            this.commandInput.focus();
        }, 100);
    }

    addWelcomeMessage() {
        setTimeout(() => {
            this.addLine('Terminal initialized. Type "help" for available commands or describe a domain-specific language you want to create!', 'info-text');
        }, 1000);
    }

    async processCommand() {
        if (!this.terminalInitialized) return;
        
        const command = this.commandInput.value.trim();
        if (!command) return;

        // Add user command to terminal
        this.addCommandLine(command);
        this.commandInput.value = '';

        // Process different commands
        if (command.toLowerCase() === 'help') {
            this.showHelp();
        } else if (command.toLowerCase() === 'clear') {
            this.clearTerminal();
        } else if (command.toLowerCase() === 'status') {
            this.showStatus();
        } else if (command.toLowerCase().startsWith('run ')) {
            const programName = command.substring(4);
            this.runProgram(programName);
        } else {
            // Treat as program description
            await this.createProgram(command);
        }
    }

    addCommandLine(command) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `
            <span class="prompt">ai@programmer:~$</span>
            <span class="command-text">${this.escapeHtml(command)}</span>
        `;
        this.terminalContent.appendChild(line);
        this.scrollToBottom();
    }

    addLine(text, className = '', delay = 0) {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = `terminal-line ${className}`;
            line.innerHTML = text;
            this.terminalContent.appendChild(line);
            this.scrollToBottom();
        }, delay);
    }

    addResponseLine(text, type = 'info', delay = 0) {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = `response-line ${type}`;
            line.innerHTML = text;
            this.terminalContent.appendChild(line);
            this.scrollToBottom();
        }, delay);
    }

    async createProgram(description) {
        this.isProcessing = true;
        this.updateStatus('processing');

        this.addResponseLine('Parser: Sending request to generator...', 'compiler', 200);
        this.startProgress();
        this.startInlineTqdm();
        try {
            const res = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_input: description })
            });
            if (!res.ok) throw new Error(`Generator returned ${res.status}`);
            const data = await res.json();

            this.currentProgram = {
                name: 'program',
                description,
                config: { domain: 'generated' },
                backend: data,
                state: 'ready'
            };

            this.addResponseLine('Parser: Language generated successfully!', 'compiler', 0);
            this.addResponseLine('Interpreter: Runtime ready.', 'interpreter', 200);

            // Prefill left editor with example code from backend (custom text area)
            if (typeof data.example === 'string' && this.codeEditor) {
                this.codeEditor.value = data.example;
                this.switchTab('console');
            }

            // Stream initial output (if any) to right side
            if (typeof data.example_output === 'string' && data.example_output.trim().length) {
                data.example_output.split('\n').forEach(line => {
                    if (line.trim().length > 0) this.addConsoleLine(line, 'interpreter');
                });
            }

            // Populate docs from backend doc
            if (typeof data.doc === 'string') {
                this.populateDocsFromBackendDoc(data.doc, description);
            } else {
                this.populateDocsFromProgram(this.currentProgram);
            }
        } catch (err) {
            this.addResponseLine(`Error generating language: ${this.escapeHtml(err.message)}`, 'error');
        }

        this.isProcessing = false;
        this.updateStatus('ready');
        this.finishProgress();
        this.finishInlineTqdm();
    }

    generateMockConfig(description) {
        // Mock configuration based on description keywords for domain-specific languages
        const config = {
            type: 'domain-specific-language',
            nodes: [],
            variables: {},
            functions: [],
            domain: 'general'
        };

        if (description.toLowerCase().includes('stock') || description.toLowerCase().includes('market') || description.toLowerCase().includes('trading')) {
            config.domain = 'stock-market';
            config.functions = [
                'calculate_moving_average(stock, period)',
                'detect_support_resistance(price_data)',
                'analyze_volume_patterns(ticker)',
                'backtest_strategy(strategy, start_date, end_date)',
                'calculate_rsi(prices, period)',
                'get_bollinger_bands(price, period, std_dev)'
            ];
            config.nodes = [
                { type: 'output', message: 'Stock Market Language initialized!' },
                { type: 'output', message: 'Available functions: Moving averages, RSI, MACD, Bollinger Bands, Volume analysis' },
                { type: 'input', prompt: 'Enter stock ticker symbol:', variable: 'ticker' },
                { type: 'input', prompt: 'Enter analysis period (days):', variable: 'period' },
                { type: 'output', message: 'Analyzing ${ticker} for ${period} days...' },
                { type: 'output', message: 'Technical analysis complete. Check console for detailed results.' }
            ];
        } else if (description.toLowerCase().includes('data science') || description.toLowerCase().includes('statistical')) {
            config.domain = 'data-science';
            config.functions = [
                'load_dataset(source)',
                'perform_statistical_analysis(data)',
                'create_visualization(data, chart_type)',
                'train_ml_model(features, target)',
                'preprocess_data(raw_data)',
                'export_results(results, format)'
            ];
            config.nodes = [
                { type: 'output', message: 'Data Science Language initialized!' },
                { type: 'output', message: 'Available functions: Statistical analysis, ML pipelines, Data visualization, ETL operations' },
                { type: 'input', prompt: 'Enter dataset path or URL:', variable: 'dataset' },
                { type: 'input', prompt: 'Select analysis type (descriptive/inferential/predictive):', variable: 'analysis_type' },
                { type: 'output', message: 'Loading dataset: ${dataset}' },
                { type: 'output', message: 'Performing ${analysis_type} analysis...' }
            ];
        } else if (description.toLowerCase().includes('game') || description.toLowerCase().includes('gaming')) {
            config.domain = 'game-development';
            config.functions = [
                'create_sprite(image_path, x, y)',
                'add_physics_object(sprite, mass, friction)',
                'play_sound(audio_file, volume)',
                'detect_collision(obj1, obj2)',
                'update_game_loop()',
                'render_graphics()'
            ];
            config.nodes = [
                { type: 'output', message: 'Game Development Language initialized!' },
                { type: 'output', message: 'Available functions: Physics simulation, Sprite management, Audio processing, Collision detection' },
                { type: 'input', prompt: 'Enter game title:', variable: 'game_title' },
                { type: 'input', prompt: 'Select game genre (platformer/puzzle/action):', variable: 'genre' },
                { type: 'output', message: 'Creating ${genre} game: ${game_title}' },
                { type: 'output', message: 'Game engine initialized. Ready for development!' }
            ];
        } else if (description.toLowerCase().includes('iot') || description.toLowerCase().includes('device')) {
            config.domain = 'iot';
            config.functions = [
                'read_sensor(sensor_type, pin)',
                'send_mqtt_message(topic, payload)',
                'control_device(device_id, action)',
                'log_data(timestamp, value)',
                'connect_wifi(ssid, password)',
                'schedule_task(function, interval)'
            ];
            config.nodes = [
                { type: 'output', message: 'IoT Language initialized!' },
                { type: 'output', message: 'Available functions: Sensor reading, MQTT communication, Device control, Data logging' },
                { type: 'input', prompt: 'Enter device ID:', variable: 'device_id' },
                { type: 'input', prompt: 'Select sensor type (temperature/humidity/motion):', variable: 'sensor_type' },
                { type: 'output', message: 'Connecting device ${device_id}...' },
                { type: 'output', message: 'Monitoring ${sensor_type} sensor. Data streaming active.' }
            ];
        } else {
            config.domain = 'general';
            config.functions = [
                'print(message)',
                'input(prompt)',
                'calculate(expression)',
                'loop(condition, action)',
                'condition(if_true, if_false)',
                'function(name, parameters)'
            ];
            config.nodes = [
                { type: 'output', message: 'Custom Domain-Specific Language initialized!' },
                { type: 'input', prompt: 'Enter your name:', variable: 'name' },
                { type: 'output', message: 'Welcome to your custom language, ${name}!' },
                { type: 'input', prompt: 'What domain is this language for?', variable: 'domain' },
                { type: 'output', message: 'Language configured for ${domain} domain. Ready to use!' }
            ];
        }

        return config;
    }

    populateExampleFromFunctions(functions = [], domain = 'general') {
        if (!this.codeEditor) return;
        const header = `# Example generated from available functions\n# Domain: ${domain}\n`;
        const calls = functions.map((sig, i) => {
            // Convert a signature like foo(a, b) into a placeholder call
            const name = sig.split('(')[0].trim();
            const argsPart = (sig.match(/\((.*)\)/) || [,''])[1];
            const args = argsPart
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .map((a, idx) => {
                    // Provide lightweight placeholders
                    if (a.toLowerCase().includes('stock') || a.toLowerCase().includes('ticker')) return `'AAPL'`;
                    if (a.toLowerCase().includes('period')) return `14`;
                    if (a.toLowerCase().includes('start')) return `'2024-01-01'`;
                    if (a.toLowerCase().includes('end')) return `'2024-12-31'`;
                    if (a.toLowerCase().includes('price') || a.toLowerCase().includes('data')) return `prices`;
                    if (a.toLowerCase().includes('std')) return `2`;
                    return `arg${idx+1}`;
                })
                .join(', ');
            return `result_${i+1} = ${name}(${args})`;
        }).join('\n');

        const scaffold = [
            header,
            "# Prepare any required data",
            "prices = [100, 102, 101, 105, 107, 110]",
            "",
            "# Call available functions",
            calls,
            "",
            "# Print a sample result",
            "print('First result:', result_1 if 'result_1' in globals() else 'n/a')"
        ].join('\n');

        this.codeEditor.value = scaffold;
        // Ensure the user can see it
        this.switchTab('console');
    }

    populateDocsFromProgram(program) {
        try {
            const docsRoot = document.querySelector('#docs-tab .docs-content');
            if (!docsRoot || !program) return;
            const { name, description, config } = program;
            const functions = config?.functions || [];

            const parts = [];
            parts.push(`<div class=\"docs-section\"><h2>${this.escapeHtml(name)} Language</h2><p>${this.escapeHtml(description)}</p></div>`);
            parts.push(`<div class=\"docs-section\"><h3>Available Functions</h3>${functions.length ? '<ul>' + functions.map(f => `<li><code>${this.escapeHtml(f)}</code></li>`).join('') + '</ul>' : '<p>No functions generated.</p>'}</div>`);
            parts.push(`<div class=\"docs-section\"><h3>Quick Start</h3><ol><li>Open the Program Console tab.</li><li>Click \"Insert Example\" to load sample code.</li><li>Click \"Run\" to execute.</li></ol></div>`);

            docsRoot.innerHTML = parts.join('');
        } catch (_) {
            // Best-effort update; ignore errors to avoid breaking UX
        }
    }

    populateDocsFromBackendDoc(doc, description) {
        try {
            const docsRoot = document.querySelector('#docs-tab .docs-content');
            if (!docsRoot) return;
            const safeDoc = this.escapeHtml(doc).replace(/\n/g, '<br/>');
            docsRoot.innerHTML = `
                <div class="docs-section">
                    <h2>Generated Language</h2>
                    <p>${this.escapeHtml(description)}</p>
                </div>
                <div class="docs-section">
                    <h3>Documentation</h3>
                    <div>${safeDoc}</div>
                </div>
                <div class="docs-section">
                    <h3>Quick Start</h3>
                    <ol>
                        <li>Open the Program Console tab.</li>
                        <li>Edit the example code on the left.</li>
                        <li>Click Run to execute and see output on the right.</li>
                    </ol>
                </div>
            `;
        } catch (_) {}
    }

    async runProgram(programName) {
        if (!this.currentProgram || this.currentProgram.name !== programName) {
            this.addResponseLine(`Error: Program "${programName}" not found. Create a program first!`, 'error');
            return;
        }

        // Switch to console tab
        this.switchTab('console');
        
        this.isProcessing = true;
        this.consolePaused = false;
        this.consoleStopped = false;
        this.updateStatus('processing');
        this.programState = { step: 0, variables: {} };

        this.addConsoleLine(`Interpreter AI: Starting execution of "${programName}"...`, 'interpreter', 500);
        
        await this.executeProgramInConsole();
        
        this.isProcessing = false;
        this.updateStatus('ready');
    }

    async executeProgram() {
        const config = this.currentProgram.config;
        
        for (let i = 0; i < config.nodes.length; i++) {
            const node = config.nodes[i];
            this.programState.step = i;
            
            await this.delay(1000);
            
            switch (node.type) {
                case 'output':
                    const message = this.interpolateVariables(node.message, this.programState.variables);
                    this.addResponseLine(`Program: ${message}`, 'interpreter');
                    break;
                    
                case 'input':
                    this.addResponseLine(`Program: ${node.prompt}`, 'user-input');
                    // In a real implementation, this would pause for user input
                    const mockInput = this.generateMockInput(node.variable);
                    this.programState.variables[node.variable] = mockInput;
                    this.addResponseLine(`User: ${mockInput}`, 'user-input', 1000);
                    break;
                    
                case 'calculate':
                    const result = this.performCalculation(node, this.programState.variables);
                    this.programState.variables.result = result;
                    this.addResponseLine(`Program: Calculated result: ${result}`, 'interpreter');
                    break;
                    
                case 'condition':
                    // Simplified condition handling
                    this.addResponseLine(`Program: Checking condition...`, 'interpreter');
                    break;
            }
        }
        
        this.addResponseLine('Program execution completed!', 'interpreter', 1000);
    }

    generateMockInput(variable) {
        const inputs = {
            'num1': '10',
            'num2': '5',
            'operation': '+',
            'name': 'Alice',
            'feeling': 'great',
            'answer1': 'Paris'
        };
        return inputs[variable] || 'mock input';
    }

    performCalculation(node, variables) {
        const a = parseFloat(variables[node.a.replace('${', '').replace('}', '')]);
        const b = parseFloat(variables[node.b.replace('${', '').replace('}', '')]);
        const op = variables[node.operation.replace('${', '').replace('}', '')];
        
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return 'Invalid operation';
        }
    }

    interpolateVariables(text, variables) {
        return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    showHelp() {
        this.addLine('Available commands:', 'info-text');
        this.addLine('• help - Show this help message', 'info-text');
        this.addLine('• clear - Clear the terminal', 'info-text');
        this.addLine('• status - Show system status', 'info-text');
        this.addLine('• run [language] - Execute code in a created domain-specific language', 'info-text');
        this.addLine('• [description] - Create a new domain-specific language from natural language', 'info-text');
        this.addLine('', 'info-text');
        this.addLine('Examples:', 'info-text');
        this.addLine('• "Create a Pythonic language with advanced stock market functions"', 'info-text');
        this.addLine('• "Build a language for data science with statistical functions"', 'info-text');
        this.addLine('• "Make a game development language with physics and graphics"', 'info-text');
    }

    showStatus() {
        this.addLine('System Status:', 'info-text');
        this.addLine('• Compiler AI (Language Designer): Ready', 'info-text');
        this.addLine('• Interpreter AI (Language Runtime): Ready', 'info-text');
        this.addLine(`• Current Language: ${this.currentProgram ? this.currentProgram.name : 'None'}`, 'info-text');
        this.addLine('• System Uptime: 1337d', 'info-text');
    }

    clearTerminal() {
        this.terminalContent.innerHTML = '';
        this.addLine('Terminal cleared.', 'info-text');
    }

    updateStatus(status) {
        if (status === 'processing') {
            this.compilerStatus.textContent = 'PARSER';
            this.compilerStatus.className = 'status-value processing';
            this.interpreterStatus.textContent = 'INTERPRETER';
            this.interpreterStatus.className = 'status-value processing';
        } else {
            this.compilerStatus.textContent = 'PARSER';
            this.compilerStatus.className = 'status-value ready';
            this.interpreterStatus.textContent = 'INTERPRETER';
            this.interpreterStatus.className = 'status-value ready';
        }
    }

    startProgress() {
        if (!this.progressContainer || !this.progressBar) return;
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = '0%';
        const start = Date.now();
        const approxMs = 60000; // ~1 minute max, but will finish early if response returns
        clearInterval(this.progressTimer);
        this.progressTimer = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min(95, Math.floor((elapsed / approxMs) * 95));
            this.progressBar.style.width = pct + '%';
        }, 200);
    }

    finishProgress() {
        if (!this.progressContainer || !this.progressBar) return;
        clearInterval(this.progressTimer);
        this.progressBar.style.width = '100%';
        setTimeout(() => {
            this.progressContainer.style.display = 'none';
            this.progressBar.style.width = '0%';
        }, 600);
    }

    // Inline tqdm-like progress under the input line
    startInlineTqdm() {
        // Create or reuse a single tqdm line under the terminal input
        if (this.tqdmTimer) clearInterval(this.tqdmTimer);
        // Insert line element
        if (!this.tqdmEl) {
            this.tqdmEl = document.createElement('div');
            this.tqdmEl.className = 'terminal-line tqdm-line';
            this.terminalContent.appendChild(this.tqdmEl);
        }
        const start = Date.now();
        const approxMs = 60000; // 60s visual budget
        const barWidth = 24; // characters in progress bar
        this.tqdmTimer = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min(0.95, elapsed / approxMs);
            const filled = Math.max(1, Math.floor(pct * barWidth));
            const bar = '[' + '='.repeat(filled - 1) + '>' + '.'.repeat(Math.max(0, barWidth - filled)) + ']';
            const pctText = String(Math.floor(pct * 100)).padStart(2, ' ');
            const esc = (ms) => {
                const s = Math.floor(ms / 1000);
                const m = Math.floor(s / 60);
                const r = s % 60;
                return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
            };
            const elapsedText = esc(elapsed);
            const totalText = esc(approxMs);
            this.tqdmEl.textContent = `${bar} ${pctText}% ${elapsedText}/${totalText}`;
            this.scrollToBottom();
        }, 200);
    }

    finishInlineTqdm() {
        if (this.tqdmTimer) {
            clearInterval(this.tqdmTimer);
            this.tqdmTimer = null;
        }
        if (this.tqdmEl) {
            // Fill to 100% briefly then remove
            this.tqdmEl.textContent = `[${'='.repeat(23)}>] 100% 01:00/01:00`;
            setTimeout(() => {
                if (this.tqdmEl && this.tqdmEl.parentNode) {
                    this.tqdmEl.parentNode.removeChild(this.tqdmEl);
                    this.tqdmEl = null;
                }
            }, 600);
        }
    }

    scrollToBottom() {
        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Tab Management Methods
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.activeTab = tabName;

        // Focus appropriate input
        if (tabName === 'main') {
            setTimeout(() => this.commandInput.focus(), 100);
        } else if (tabName === 'console') {
            setTimeout(() => this.consoleInput.focus(), 100);
        }
    }

    closeTab(tabElement) {
        const tabName = tabElement.dataset.tab;
        if (tabName === 'main') return; // Can't close main tab

        tabElement.remove();
        document.getElementById(`${tabName}-tab`).remove();

        // Switch to main tab if closing active tab
        if (this.activeTab === tabName) {
            this.switchTab('main');
        }
    }

    addNewTab() {
        // For now, just show a message - could be extended to create new terminal instances
        this.addResponseLine('New tab functionality coming soon!', 'info-text');
    }

    // Console Methods
    addConsoleLine(text, type = 'info', delay = 0) {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = `console-line ${type}`;
            
            if (type === 'interpreter') {
                line.innerHTML = `
                    <span class="console-prompt">interpreter@ai:~$</span>
                    <span class="console-text">${this.escapeHtml(text)}</span>
                `;
            } else if (type === 'user-input') {
                line.innerHTML = `
                    <span class="console-prompt">input@program:~$</span>
                    <span class="console-text">${this.escapeHtml(text)}</span>
                `;
            } else if (type === 'error') {
                line.innerHTML = `
                    <span class="console-prompt">error@system:~$</span>
                    <span class="console-text" style="color: #f85149;">${this.escapeHtml(text)}</span>
                `;
            } else {
                line.innerHTML = `
                    <span class="console-prompt">console@execution:~$</span>
                    <span class="console-text">${this.escapeHtml(text)}</span>
                `;
            }
            
            this.consoleOutput.appendChild(line);
            this.scrollConsoleToBottom();
        }, delay);
    }

    async executeProgramInConsole() {
        const config = this.currentProgram.config;
        
        for (let i = 0; i < config.nodes.length; i++) {
            if (this.consoleStopped) break;
            
            // Wait if paused
            while (this.consolePaused && !this.consoleStopped) {
                await this.delay(100);
            }
            
            if (this.consoleStopped) break;
            
            const node = config.nodes[i];
            this.programState.step = i;
            
            await this.delay(1000);
            
            switch (node.type) {
                case 'output':
                    const message = this.interpolateVariables(node.message, this.programState.variables);
                    this.addConsoleLine(`Program: ${message}`, 'interpreter');
                    break;
                    
                case 'input':
                    this.addConsoleLine(`Program: ${node.prompt}`, 'user-input');
                    // Show input area
                    this.consoleInputArea.style.display = 'block';
                    this.consoleInput.placeholder = node.prompt;
                    this.consoleInput.focus();
                    
                    // Set current variable for input tracking
                    this.programState.currentVariable = node.variable;
                    
                    // Wait for user input (simulated for now)
                    const mockInput = this.generateMockInput(node.variable);
                    this.programState.variables[node.variable] = mockInput;
                    this.addConsoleLine(`User: ${mockInput}`, 'user-input', 1000);
                    
                    // Show output panel and process the input
                    setTimeout(() => {
                        this.showOutputPanel();
                        this.processConsoleInput(mockInput);
                    }, 1500);
                    
                    // Hide input area after a delay
                    setTimeout(() => {
                        this.consoleInputArea.style.display = 'none';
                        this.programState.currentVariable = null;
                    }, 3000);
                    break;
                    
                case 'calculate':
                    const result = this.performCalculation(node, this.programState.variables);
                    this.programState.variables.result = result;
                    this.addConsoleLine(`Program: Calculated result: ${result}`, 'interpreter');
                    break;
                    
                case 'condition':
                    this.addConsoleLine(`Program: Checking condition...`, 'interpreter');
                    break;
            }
        }
        
        if (!this.consoleStopped) {
            this.addConsoleLine('Program execution completed!', 'interpreter', 1000);
        }
    }

    handleConsoleInput() {
        const input = this.consoleInput.value.trim();
        if (!input) return;

        this.addConsoleLine(`User: ${input}`, 'user-input');
        this.consoleInput.value = '';
        
        // Hide input area
        this.consoleInputArea.style.display = 'none';
        
        // Show output panel and process the input
        this.showOutputPanel();
        this.processConsoleInput(input);
        
        // Store the input in program state if we have a current variable
        if (this.programState && this.programState.currentVariable) {
            this.programState.variables[this.programState.currentVariable] = input;
        }
    }

    clearConsole() {
        this.consoleOutput.innerHTML = `
            <div class="console-line">
                <span class="console-prompt">console@execution:~$</span>
                <span class="console-text">Console cleared.</span>
            </div>
        `;
    }

    toggleConsolePause() {
        this.consolePaused = !this.consolePaused;
        this.pauseConsoleBtn.textContent = this.consolePaused ? 'Resume' : 'Pause';
        
        if (this.consolePaused) {
            this.addConsoleLine('Program execution paused.', 'info');
        } else {
            this.addConsoleLine('Program execution resumed.', 'info');
        }
    }

    stopConsole() {
        this.consoleStopped = true;
        this.consolePaused = false;
        this.pauseConsoleBtn.textContent = 'Pause';
        this.addConsoleLine('Program execution stopped.', 'error');
    }

    scrollConsoleToBottom() {
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    // Output Panel Methods
    showOutputPanel() {
        this.outputPanel.style.display = 'flex';
        this.mainContent.classList.add('with-output');
    }

    closeOutputPanel() {
        this.outputPanel.style.display = 'none';
        this.mainContent.classList.remove('with-output');
    }

    clearOutputs() {
        this.outputResults.innerHTML = '<p class="output-placeholder">Program outputs will appear here...</p>';
        this.outputVariables.innerHTML = '<p class="output-placeholder">Variable states will be tracked here...</p>';
        this.outputFunctions.innerHTML = '<p class="output-placeholder">Function execution logs will appear here...</p>';
    }

    processConsoleInput(input) {
        // Simulate processing the console input and generating outputs
        setTimeout(() => {
            this.addOutputResult(`Processing input: "${input}"`);
            this.addOutputResult(`Input type: ${this.detectInputType(input)}`);
            this.addOutputResult(`Status: Processed successfully`);
        }, 500);

        setTimeout(() => {
            this.updateVariableStates(input);
        }, 1000);

        setTimeout(() => {
            this.addFunctionCall('process_input', [input]);
            this.addFunctionCall('validate_data', [input]);
            this.addFunctionCall('execute_logic', [input]);
        }, 1500);
    }

    detectInputType(input) {
        if (/^\d+$/.test(input)) return 'Number';
        if (/^[a-zA-Z]+$/.test(input)) return 'String';
        if (/^\d+\.\d+$/.test(input)) return 'Float';
        return 'Mixed';
    }

    addOutputResult(text) {
        const placeholder = this.outputResults.querySelector('.output-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const result = document.createElement('div');
        result.className = 'output-item';
        result.textContent = text;
        this.outputResults.appendChild(result);
    }

    updateVariableStates(input) {
        const placeholder = this.outputVariables.querySelector('.output-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Clear existing variables
        this.outputVariables.innerHTML = '';
        
        // Add current variables
        const variables = [
            { name: 'user_input', value: `"${input}"` },
            { name: 'input_length', value: input.length },
            { name: 'input_type', value: this.detectInputType(input) },
            { name: 'timestamp', value: new Date().toLocaleTimeString() }
        ];

        variables.forEach(variable => {
            const item = document.createElement('div');
            item.className = 'variable-item';
            item.innerHTML = `
                <span class="variable-name">${variable.name}</span>
                <span class="variable-value">${variable.value}</span>
            `;
            this.outputVariables.appendChild(item);
        });
    }

    addFunctionCall(functionName, args) {
        const placeholder = this.outputFunctions.querySelector('.output-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        const call = document.createElement('div');
        call.className = 'function-call';
        call.innerHTML = `
            <div class="function-name">${functionName}()</div>
            <div class="function-args">Arguments: ${args.map(arg => `"${arg}"`).join(', ')}</div>
        `;
        this.outputFunctions.appendChild(call);
    }
}

// Initialize the terminal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AITerminal();
});

// Add some terminal-like effects
document.addEventListener('keydown', (e) => {
    // Add terminal sound effect (optional)
    if (e.key.length === 1) {
        // You could add a subtle click sound here
    }
});

// Add blinking cursor effect to input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('command-input');
    let cursorVisible = true;
    
    setInterval(() => {
        cursorVisible = !cursorVisible;
        input.style.caretColor = cursorVisible ? '#00ff00' : 'transparent';
    }, 500);
});
