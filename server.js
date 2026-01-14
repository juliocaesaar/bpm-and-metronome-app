const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Servidor HTTP para servir arquivos estáticos
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Arquivo não encontrado</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Erro interno do servidor: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Servidor WebSocket
const wss = new WebSocket.Server({ server });

// Armazenar sessões ativas
const sessions = new Map();
const clients = new Map();

// Gerar ID único para sessão
function generateSessionId() {
    return Math.random().toString(36).substr(2, 9);
}

// Gerar ID único para cliente
function generateClientId() {
    return Math.random().toString(36).substr(2, 9);
}

// Estrutura de uma sessão
class Session {
    constructor(id, hostId, hostName) {
        this.id = id;
        this.hostId = hostId;
        this.hostName = hostName;
        this.clients = new Map();
        this.state = {
            bpm: 120,
            isPlaying: false,
            currentPresetId: null,
            currentAmbientKey: null,
            metronomeVolume: 50,
            ambientVolume: 50,
            soundType: 'ASRX',
            timeSignature: '4/4',
            repertorios: {},
            currentRepertorioId: 'default'
        };
        this.createdAt = new Date();
    }

    addClient(clientId, clientName, ws) {
        this.clients.set(clientId, {
            id: clientId,
            name: clientName,
            ws: ws,
            isHost: clientId === this.hostId,
            joinedAt: new Date()
        });
    }

    removeClient(clientId) {
        this.clients.delete(clientId);
    }

    broadcast(message, excludeClientId = null) {
        console.log(`Broadcasting message to ${this.clients.size} clients, excluding: ${excludeClientId}`);
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
                console.log(`Enviando para cliente ${clientId} (${client.name})`);
                client.ws.send(JSON.stringify(message));
            } else {
                console.log(`Pulando cliente ${clientId} - exclude: ${clientId === excludeClientId}, readyState: ${client.ws.readyState}`);
            }
        });
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        console.log('Sessão', this.id, 'atualizando estado para:', this.state);
        this.broadcast({
            type: 'state_update',
            state: this.state
        });
    }

    getClientList() {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            name: client.name,
            isHost: client.isHost,
            joinedAt: client.joinedAt
        }));
    }
}

wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    console.log(`Cliente conectado: ${clientId}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`Mensagem recebida de ${clientId}:`, data.type);

            switch (data.type) {
                case 'create_session':
                    handleCreateSession(ws, clientId, data);
                    break;
                case 'join_session':
                    handleJoinSession(ws, clientId, data);
                    break;
                case 'leave_session':
                    handleLeaveSession(clientId);
                    break;
                case 'state_update':
                    handleStateUpdate(clientId, data);
                    break;
                case 'control_action':
                    handleControlAction(clientId, data);
                    break;
                case 'get_sessions':
                    handleGetSessions(ws, clientId);
                    break;
                default:
                    console.log(`Tipo de mensagem desconhecido: ${data.type}`);
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Erro ao processar mensagem'
            }));
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado: ${clientId}`);
        handleLeaveSession(clientId);
    });

    ws.on('error', (error) => {
        console.error(`Erro no WebSocket do cliente ${clientId}:`, error);
    });
});

function handleCreateSession(ws, clientId, data) {
    const sessionId = generateSessionId();
    const session = new Session(sessionId, clientId, data.hostName || 'Host');
    
    session.addClient(clientId, data.hostName || 'Host', ws);
    sessions.set(sessionId, session);
    clients.set(clientId, { sessionId, ws });

    console.log(`Sessão criada: ${sessionId} por ${data.hostName}`);

    ws.send(JSON.stringify({
        type: 'session_created',
        sessionId: sessionId,
        clientId: clientId,
        isHost: true,
        state: session.state
    }));
}

function handleJoinSession(ws, clientId, data) {
    const session = sessions.get(data.sessionId);
    
    if (!session) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Sessão não encontrada'
        }));
        return;
    }

    if (session.clients.size >= 10) { // Limite de 10 clientes por sessão
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Sessão cheia'
        }));
        return;
    }

    session.addClient(clientId, data.clientName || 'Cliente', ws);
    clients.set(clientId, { sessionId: data.sessionId, ws });

    console.log(`Cliente ${data.clientName} entrou na sessão ${data.sessionId}`);

    // Notificar o novo cliente
    ws.send(JSON.stringify({
        type: 'session_joined',
        sessionId: data.sessionId,
        clientId: clientId,
        isHost: false,
        state: session.state,
        clients: session.getClientList()
    }));
    
    console.log('Cliente', data.clientName, 'entrou na sessão', data.sessionId, 'com estado:', session.state);

    // Notificar outros clientes
    session.broadcast({
        type: 'client_joined',
        client: {
            id: clientId,
            name: data.clientName || 'Cliente',
            isHost: false,
            joinedAt: new Date()
        }
    }, clientId);
}

function handleLeaveSession(clientId) {
    const client = clients.get(clientId);
    if (!client) return;

    const session = sessions.get(client.sessionId);
    if (!session) return;

    const clientInfo = session.clients.get(clientId);
    if (!clientInfo) return;

    session.removeClient(clientId);
    clients.delete(clientId);

    console.log(`Cliente ${clientInfo.name} saiu da sessão ${session.id}`);

    // Se o host saiu, transferir host para outro cliente ou fechar sessão
    if (clientInfo.isHost) {
        if (session.clients.size > 0) {
            // Transferir host para o primeiro cliente disponível
            const newHost = session.clients.values().next().value;
            newHost.isHost = true;
            session.hostId = newHost.id;
            
            session.broadcast({
                type: 'host_transferred',
                newHostId: newHost.id,
                newHostName: newHost.name
            });
        } else {
            // Fechar sessão se não há mais clientes
            sessions.delete(session.id);
            console.log(`Sessão ${session.id} fechada (sem clientes)`);
        }
    } else {
        // Notificar outros clientes sobre a saída
        session.broadcast({
            type: 'client_left',
            clientId: clientId,
            clientName: clientInfo.name
        });
    }
}

function handleStateUpdate(clientId, data) {
    console.log(`handleStateUpdate chamado para cliente ${clientId}`);
    const client = clients.get(clientId);
    if (!client) {
        console.log(`Cliente ${clientId} não encontrado`);
        return;
    }

    const session = sessions.get(client.sessionId);
    if (!session) {
        console.log(`Sessão ${client.sessionId} não encontrada`);
        return;
    }

    const clientInfo = session.clients.get(clientId);
    if (!clientInfo) {
        console.log(`ClientInfo para ${clientId} não encontrado na sessão`);
        return;
    }

    // TODOS os clientes podem atualizar o estado (controle compartilhado)
    console.log(`Cliente ${clientInfo.name} (${clientId}) atualizando estado na sessão ${session.id}:`, data.state);
    session.updateState(data.state);
}

function handleControlAction(clientId, data) {
    const client = clients.get(clientId);
    if (!client) return;

    const session = sessions.get(client.sessionId);
    if (!session) return;

    const clientInfo = session.clients.get(clientId);
    if (!clientInfo) return;

    // TODOS os clientes podem executar ações de controle (controle compartilhado)
    console.log(`Cliente ${clientInfo.name} executando ação de controle na sessão ${session.id}:`, data.action, data.data);

    // Broadcast da ação para todos os clientes
    session.broadcast({
        type: 'control_action',
        action: data.action,
        data: data.data
    });
}

function handleGetSessions(ws, clientId) {
    console.log(`Cliente ${clientId} solicitou lista de sessões`);
    const sessionList = Array.from(sessions.values()).map(session => ({
        id: session.id,
        hostName: session.hostName,
        clientCount: session.clients.size,
        createdAt: session.createdAt,
        name: `${session.hostName}'s Session` // Nome amigável da sessão
    }));

    console.log(`Enviando ${sessionList.length} sessões para cliente ${clientId}:`, sessionList);

    ws.send(JSON.stringify({
        type: 'sessions_list',
        sessions: sessionList
    }));
}

// Limpeza periódica de sessões inativas
setInterval(() => {
    const now = new Date();
    sessions.forEach((session, sessionId) => {
        if (session.clients.size === 0) {
            sessions.delete(sessionId);
            console.log(`Sessão ${sessionId} removida (inativa)`);
        }
    });
}, 60000); // Limpeza a cada minuto

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
    console.log('Para acessar de outros dispositivos na rede, use o IP da máquina');
});
