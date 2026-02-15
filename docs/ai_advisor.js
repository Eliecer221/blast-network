/* 
   GLENIS IA - NEURAL INVESTMENT ADVISOR
   Styles: Black Futuristic / Cybernetic
   Capabilities: Market Data, Investment Strategy, Daily Chit-chat
   Restrictions: NO Tech Support
*/

class GlenisAI {
    constructor() {
        this.isOpen = false;
        this.marketData = {
            'BTC': { price: 68500, trend: 'bullish' },
            'ETH': { price: 3450, trend: 'neutral' },
            'BLAST': { price: 0.042, trend: 'moon' },
            'SOL': { price: 145, trend: 'bullish' },
            'BNB': { price: 590, trend: 'bearish' }
        };
        // Bind methods
        this.processQuery = this.processQuery.bind(this);
    }

    init() {
        // Start Market Simulation
        setInterval(() => this.updateMarket(), 3000);
        console.log('Glenis IA System Initialized');
    }

    updateMarket() {
        // Simulate live market fluctuations
        for (let coin in this.marketData) {
            const change = (Math.random() - 0.5) * (this.marketData[coin].price * 0.002);
            this.marketData[coin].price += change;
        }
    }

    processQuery(input) {
        const lowerInput = input.toLowerCase();

        // 1. FILTER: Technical Support (STRICTLY FORBIDDEN)
        if (lowerInput.includes('error') || lowerInput.includes('bug') ||
            lowerInput.includes('no funciona') || lowerInput.includes('login') ||
            lowerInput.includes('password') || lowerInput.includes('billetera madre') ||
            lowerInput.includes('distribucion') || lowerInput.includes('servidor')) {
            return this.response("Lo siento, mi protocolo neural está limitado a **Asesoramiento Financiero y Mercados**. Para soporte técnico o detalles del sistema, por favor consulta la documentación oficial o contacta al equipo de desarrollo.");
        }

        // 2. MARKET DATA
        if (lowerInput.includes('precio') || lowerInput.includes('cuanto vale') || lowerInput.includes('price')) {
            let response = "📊 **Estado del Mercado Neural:**\n";
            for (let coin in this.marketData) {
                const price = this.marketData[coin].price.toFixed(coin === 'BLAST' ? 4 : 2);
                const icon = this.marketData[coin].trend === 'moon' ? '🚀' : (this.marketData[coin].trend === 'bullish' ? '📈' : '📉');
                response += `> **${coin}**: $${price} ${icon}\n`;
            }
            return this.response(response + "\n*Datos actualizados en tiempo real.*");
        }

        // 3. INVESTMENT ADVICE
        if (lowerInput.includes('invertir') || lowerInput.includes('consejo') || lowerInput.includes('comprar')) {
            const advice = [
                "Mis algoritmos detectan una alta volatilidad. La estrategia **DCA (Dollar Cost Averaging)** es matemática superior en estos momentos.",
                "El token **BLAST** muestra patrones de acumulación masiva. Un portafolio diversificado con exposición a L2s es recomendable.",
                "Recuerda: 'Not your keys, not your coins'. Asegura tus activos en la **Blast Vault** antes de expandir tu posición.",
                "El mercado está en fase de euforia. Mantén la cabeza fría y toma ganancias escalonadas."
            ];
            return this.response(advice[Math.floor(Math.random() * advice.length)]);
        }

        // 4. CHITCHAT / PERSONALITY
        if (lowerInput.includes('hola') || lowerInput.includes('quien eres')) {
            return this.response("Saludos. Soy **Glenis IA**, tu oráculo cybernético de inversiones. Estoy conectada a la red global para optimizar tu capital. ¿En qué puedo asistirte hoy?");
        }

        if (lowerInput.includes('gracias')) {
            return this.response("Siempre a la orden. Que tus rendimientos sean exponenciales. 💎");
        }

        // DEFAULT
        return this.response("Interesante input. Mis procesadores sugieren que revisemos los **mercados** o discutamos una **estrategia de inversión**. ¿Qué prefieres?");
    }

    response(text) {
        return {
            text: text,
            timestamp: new Date().toLocaleTimeString()
        };
    }
}

// UI Controller
const glenisAI = new GlenisAI();
glenisAI.init();

function toggleChat() {
    const chatWindow = document.getElementById('glenis-chat-window');
    // Simple toggle logic
    if (chatWindow.style.display === 'flex') {
        chatWindow.style.display = 'none';
    } else {
        chatWindow.style.display = 'flex';
        // Add welcome message if empty
        const msgs = document.getElementById('chat-messages');
        if (msgs.children.length === 0) {
            addMessage("Protocolo Glenis IA iniciado. ¿En qué activo estás interesado hoy?", 'bot');
        }
    }
}

function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text) return;

    // User Message
    addMessage(text, 'user');
    input.value = '';

    // Simulate Thinking
    const msgs = document.getElementById('chat-messages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot typing';
    typingIndicator.innerText = 'Consultando Oracle Chain...';
    msgs.appendChild(typingIndicator);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(() => {
        msgs.removeChild(typingIndicator);
        const reply = glenisAI.processQuery(text);
        addMessage(reply.text, 'bot');
    }, 1500);
}

function addMessage(text, sender) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    // Simple HTML parsing for bold and newlines
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    div.innerHTML = formatted;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// Global scope expose
window.toggleChat = toggleChat;
window.sendChat = sendChat;

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendChat();
        });
    }
});
