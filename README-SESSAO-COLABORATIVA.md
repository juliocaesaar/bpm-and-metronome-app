# 🎵 Sessão Colaborativa - BPM Metronome App

## Como Funciona

A funcionalidade de **Sessão Colaborativa** permite que múltiplos dispositivos na mesma rede local se conectem e sincronizem em tempo real. Um dispositivo atua como **host** (controla tudo) e os outros como **participantes** (apenas observam).

## 🚀 Como Usar

### 1. Iniciar o Servidor

**Opção A - Script Automático:**
```bash
# Windows
start-server.bat

# Linux/Mac
node server.js
```

**Opção B - Manual:**
```bash
npm install
node server.js
```

O servidor será executado em `http://localhost:3000`

### 2. Criar uma Sessão (Host)

1. Abra o aplicativo no seu dispositivo
2. Clique em **"🎯 Criar Sessão"**
3. Digite seu nome
4. (Opcional) Configure o servidor se necessário
5. Clique em **"Criar Sessão"**
6. **Anote o código da sessão** que aparecerá
7. Compartilhe este código com outros dispositivos

### 3. Entrar em uma Sessão (Participante)

1. Abra o aplicativo em outro dispositivo
2. Clique em **"🔗 Entrar em Sessão"**
3. Digite seu nome
4. Digite o **código da sessão** fornecido pelo host
5. (Opcional) Configure o servidor se necessário
6. Clique em **"Entrar na Sessão"**

## 🎛️ O que é Sincronizado

### Controles do Host (sincronizados para todos):
- ✅ **BPM** - Mudanças no tempo
- ✅ **Metronome** - Play/Pause/Stop
- ✅ **Presets** - Carregamento de músicas salvas
- ✅ **Pads Ambientais** - Sons de fundo
- ✅ **Volumes** - Metronome e Ambient
- ✅ **Tipo de Som** - ASRX, 3000, SP1200, Zoom ST
- ✅ **Assinatura de Tempo** - 1/4, 4/4

### Visualização (todos veem):
- 📊 **Display do BPM** atual
- 🎵 **Preset ativo** sendo tocado
- 🔊 **Indicadores de volume** em tempo real
- 👥 **Lista de dispositivos** conectados

## 🌐 Configuração de Rede

### Servidor Padrão
- **URL:** `ws://[IP_DA_MAQUINA]:3000`
- **Porta:** 3000
- **Protocolo:** WebSocket

### Para Usar em Rede Local

1. **Descubra o IP da máquina host:**
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Configure o servidor nos outros dispositivos:**
   - Use: `ws://192.168.1.100:3000` (substitua pelo IP correto)

### Exemplo de Uso em Rede

```
Dispositivo Host (João):
- IP: 192.168.1.100
- Cria sessão: "abc123def"
- Controla tudo

Dispositivo Participante (Maria):
- IP: 192.168.1.101
- Entra na sessão: "abc123def"
- Servidor: ws://192.168.1.100:3000
- Apenas observa
```

## 🔧 Solução de Problemas

### Erro de Conexão
- ✅ Verifique se o servidor está rodando
- ✅ Confirme que todos estão na mesma rede
- ✅ Teste o IP do servidor
- ✅ Verifique se a porta 3000 está liberada

### Sessão Não Encontrada
- ✅ Confirme o código da sessão
- ✅ Verifique se a sessão ainda está ativa
- ✅ Tente criar uma nova sessão

### Sincronização Não Funciona
- ✅ Confirme que você é o host
- ✅ Verifique a conexão WebSocket
- ✅ Recarregue a página se necessário

## 📱 Compatibilidade

- ✅ **Desktop** - Chrome, Firefox, Safari, Edge
- ✅ **Mobile** - iOS Safari, Android Chrome
- ✅ **Tablet** - iPad, Android tablets
- ✅ **PWA** - Funciona como app instalado

## 🔒 Segurança

- 🔐 **Rede Local Apenas** - Não funciona pela internet
- 🔐 **Sem Autenticação** - Acesso livre na rede local
- 🔐 **Dados Temporários** - Nenhum dado é salvo no servidor
- 🔐 **Conexão Direta** - Comunicação peer-to-peer via WebSocket

## 🎯 Casos de Uso

### Ensaios de Banda
- **Host:** Baterista controla o metronome
- **Participantes:** Guitarrista, baixista, vocalista acompanham

### Aulas de Música
- **Host:** Professor controla o tempo
- **Participantes:** Alunos acompanham o ritmo

### Produção Musical
- **Host:** Produtor ajusta BPM e presets
- **Participantes:** Músicos acompanham as mudanças

### Apresentações
- **Host:** Maestro controla tudo
- **Participantes:** Músicos da orquestra acompanham

## 🚀 Recursos Avançados

### Transferência de Host
- Se o host sair, o controle é transferido automaticamente
- O novo host pode controlar a sessão

### Múltiplas Sessões
- Várias sessões podem rodar simultaneamente
- Cada sessão tem seu próprio código único

### Limite de Participantes
- Máximo de 10 dispositivos por sessão
- Previne sobrecarga do servidor

## 📞 Suporte

Se encontrar problemas:

1. **Verifique o console do navegador** (F12)
2. **Confirme a conexão de rede**
3. **Teste com dispositivos na mesma rede**
4. **Reinicie o servidor se necessário**

---

**🎵 Divirta-se criando música em conjunto!**
