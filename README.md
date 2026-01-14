# 🎵 BPM & Metronome App

Um aplicativo completo de metrônomo e calculadora de BPM com pads ambientais e **sessões colaborativas em rede local**.

## ✨ Funcionalidades

### 🎯 Metrônomo Avançado
- ✅ Calculadora de BPM por tap
- ✅ Controle manual de BPM (40-300)
- ✅ 4 tipos de som: ASRX, 3000, SP1200, Zoom ST
- ✅ Assinaturas de tempo: 1/4, 4/4
- ✅ Controle de volume independente
- ✅ Monitor de volume em tempo real

### 🎹 Pads Ambientais
- ✅ 12 notas musicais (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- ✅ Transições suaves entre pads
- ✅ Loop contínuo sem interrupções
- ✅ Controle de volume independente

### 📚 Sistema de Repertório
- ✅ Múltiplos repertórios
- ✅ Presets com BPM e pad salvos
- ✅ Navegação rápida entre músicas
- ✅ Importar/Exportar repertórios
- ✅ Drag & Drop para reordenar

### 🌐 **Sessão Colaborativa (NOVO!)**
- ✅ **Múltiplos dispositivos** na mesma rede
- ✅ **Sincronização em tempo real** de todos os controles
- ✅ **Host controla tudo**, participantes acompanham
- ✅ **Indicadores visuais** de dispositivos conectados
- ✅ **Transferência automática** de host
- ✅ **Até 10 dispositivos** por sessão

## 🚀 Como Usar

### Instalação Rápida
```bash
# Instalar dependências
npm install

# Iniciar servidor (para sessões colaborativas)
node server.js
# ou use: start-server.bat (Windows)
```

### Sessão Colaborativa
1. **Host:** Clique em "🎯 Criar Sessão"
2. **Anote o código** da sessão
3. **Participantes:** Clique em "🔗 Entrar em Sessão"
4. **Digite o código** e conecte-se
5. **Host controla**, todos acompanham!

📖 **Guia completo:** [README-SESSAO-COLABORATIVA.md](README-SESSAO-COLABORATIVA.md)

## 🎛️ Controles

### Teclado
- `S` - Salvar preset atual
- `L` - Carregar preset por índice
- `E` - Editar preset ativo
- `D` - Deletar preset ativo
- `↑/↓` - Próximo/Anterior preset
- `Enter` - Tocar preset ativo

### Interface
- **TAP** - Calcular BPM
- **+/-** - Ajustar BPM manualmente
- **▶ Play** - Iniciar metrônomo
- **⏹ Stop** - Parar metrônomo
- **Pads** - Tocar sons ambientais
- **Presets** - Carregar músicas salvas

## 🌐 Rede Local

### Para Sessões Colaborativas
- **Servidor:** `ws://[IP]:3000`
- **Porta:** 3000
- **Protocolo:** WebSocket
- **Rede:** Local apenas (não funciona pela internet)

### Exemplo de Uso
```
Host (192.168.1.100):
- Cria sessão: "abc123def"
- Controla BPM, presets, pads

Participante (192.168.1.101):
- Entra na sessão: "abc123def"
- Acompanha tudo em tempo real
```

## 📱 Compatibilidade

- ✅ **Desktop** - Chrome, Firefox, Safari, Edge
- ✅ **Mobile** - iOS Safari, Android Chrome
- ✅ **Tablet** - iPad, Android tablets
- ✅ **PWA** - Instalável como app
- ✅ **Electron** - App desktop nativo

## 🔧 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Audio:** Web Audio API, AudioContext
- **Rede:** WebSocket, Node.js
- **PWA:** Service Worker, Manifest
- **Desktop:** Electron

## 📦 Build

### Desktop App
```bash
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

### Web App
```bash
# Servir arquivos estáticos
# Ou usar servidor local
node server.js
```

## 🎯 Casos de Uso

### 🎸 Ensaios de Banda
- Baterista controla o metrônomo
- Guitarrista, baixista acompanham

### 🎓 Aulas de Música
- Professor controla o tempo
- Alunos acompanham o ritmo

### 🎵 Produção Musical
- Produtor ajusta BPM e presets
- Músicos acompanham mudanças

### 🎼 Apresentações
- Maestro controla tudo
- Orquestra acompanha

## 🔒 Segurança

- 🔐 **Rede Local Apenas** - Não funciona pela internet
- 🔐 **Sem Autenticação** - Acesso livre na rede local
- 🔐 **Dados Temporários** - Nenhum dado salvo no servidor
- 🔐 **Conexão Direta** - Comunicação peer-to-peer

## 📞 Suporte

### Problemas Comuns
1. **Erro de conexão:** Verifique se o servidor está rodando
2. **Sessão não encontrada:** Confirme o código da sessão
3. **Sincronização não funciona:** Verifique se você é o host

### Debug
- Abra o console do navegador (F12)
- Verifique mensagens de erro
- Teste a conexão de rede

---

**🎵 Versão atual: v4.0 com Sessão Colaborativa**

**Divirta-se criando música em conjunto!** 🎶
