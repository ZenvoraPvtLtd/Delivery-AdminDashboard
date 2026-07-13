import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar, Box, Chip, Fade, IconButton, Paper, TextField, Typography, useTheme } from '@mui/material';
import { Bot, Minimize2, Send, X } from 'lucide-react';
import { RootState } from '../store';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  source?: string;
  latencyMs?: number;
  route?: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
  source?: string;
  route?: string;
  latencyMs?: number;
}

const getRouteLabel = (route: string) => {
  if (route === '/orders') return 'Go to Orders Desk 📦';
  if (route === '/customers') return 'Go to Customer Registry 👥';
  if (route === '/delivery-partners') return 'Go to Delivery Fleet 🛵';
  if (route === '/inventory') return 'Go to Inventory Logs 📦';
  if (route === '/products') return 'Go to Menu Settings 🍔';
  if (route === '/coupons') return 'Go to Coupons & Offers 🏷️';
  if (route === '/payments') return 'Go to Payments Page 💳';
  if (route === '/reports-analytics') return 'Go to Performance Reports 📊';
  if (route === '/reviews-complaints') return 'Go to Reviews Queue 🎫';
  if (route === '/outlet-management') return 'Go to Outlets Directory 🏢';
  if (route === '/user-management') return 'Go to Staff Accounts 👥';
  if (route === '/role-permissions') return 'Go to Access Controls 🔐';
  if (route === '/banner-cms') return 'Go to Homepage CMS 🖥️';
  if (route === '/audit-logs') return 'Go to Audit Logs 🗒️';
  if (route === '/settings') return 'Go to Settings Panel ⚙️';
  return 'Go to Dashboard 📊';
};

const QUICK_REPLIES = ['Active orders?', 'Low stock items', 'Available riders', 'Revenue summary', 'Open tickets'];

const getOfflineReply = (
  input: string,
  context: { orders: number; customers: number; partners: number }
): string => {
  const q = input.toLowerCase().trim();

  if (q.match(/hello|hi|hey|namaste/)) {
    return `Hello! I'm DelivoBot, your admin assistant. I can help with orders, customers, riders, inventory, reports, and settings.`;
  }
  if (q.match(/order|orders/)) {
    return `You currently have **${context.orders} active orders**. Open **Orders** to update statuses, assign riders, and process refunds.`;
  }
  if (q.match(/customer|customers/)) {
    return `There are **${context.customers} registered customers**. Use **Customers** to review profiles, wallet balances, and account status.`;
  }
  if (q.match(/rider|delivery partner|partners/)) {
    return `There are **${context.partners} delivery partners** registered. Use **Delivery Partners** to track availability, GPS, and payouts.`;
  }
  if (q.match(/inventory|stock|material/)) {
    return `Use **Inventory** to review raw material stock, low-stock alerts, suppliers, and expiry dates.`;
  }
  if (q.match(/revenue|sales|report|analytics/)) {
    return `Use **Reports & Analytics** for revenue trends, outlet performance, and export-ready business reports.`;
  }
  if (q.match(/help|what can you do|assist/)) {
    return `I can help with orders, customers, riders, inventory, coupons, payments, support tickets, reports, user roles, and settings.`;
  }

  return `I can help with the **Delivo Admin Panel**. Current snapshot: **${context.orders} active orders**, **${context.customers} customers**, and **${context.partners} delivery partners**. Ask about a module or action and I will guide you.`;
};

const ChatbotWidget: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm **DelivoBot**, your LangChain-powered admin assistant. Ask me about live orders, riders, inventory, customers, revenue, or support tickets.`,
      sender: 'bot',
      timestamp: new Date(),
      source: 'langchain-system'
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeOrders = useSelector((state: RootState) =>
    state.db.orders.filter(o => ['Pending', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length
  );
  const customerCount = useSelector((state: RootState) => state.db.customers.length);
  const partnerCount = useSelector((state: RootState) => state.db.deliveryPartners.length);

  const context = { orders: activeOrders, customers: customerCount, partners: partnerCount };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    const userText = text || input.trim();
    if (!userText || typing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };
    const history = messages.slice(-8).map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const response = await axios.post<ChatResponse>('/api/chat', {
        message: userText,
        history
      });

      const botMsg: Message = {
        id: `${Date.now()}-bot`,
        text: response.data.reply || getOfflineReply(userText, context),
        sender: 'bot',
        timestamp: new Date(),
        source: response.data.source,
        latencyMs: response.data.latencyMs,
        route: response.data.route
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn('Chat backend unavailable, using offline assistant.', err);
      const botMsg: Message = {
        id: `${Date.now()}-offline`,
        text: getOfflineReply(userText, context),
        sender: 'bot',
        timestamp: new Date(),
        source: 'local-fallback',
        latencyMs: 5,
        route: inferRoute(userText)
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setTyping(false);
    }
  };

  // Helper to replicate local route inference in frontend fallback
  const inferRoute = (question: string): string => {
    const q = question.toLowerCase();
    if (/order|dispatch|prepar|refund|cancel/.test(q)) return '/orders';
    if (/customer|wallet|reward|block/.test(q)) return '/customers';
    if (/rider|delivery partner|driver|gps/.test(q)) return '/delivery-partners';
    if (/stock|inventory|raw|material|supplier/.test(q)) return '/inventory';
    if (/product|menu|item|dish|availability/.test(q)) return '/products';
    if (/coupon|promo|offer|discount/.test(q)) return '/coupons';
    if (/payment|transaction|settlement|finance/.test(q)) return '/payments';
    if (/report|analytic|revenue|sales/.test(q)) return '/reports-analytics';
    if (/ticket|complaint|review|feedback/.test(q)) return '/reviews-complaints';
    if (/outlet|branch|store|location/.test(q)) return '/outlet-management';
    if (/user|staff|admin account/.test(q)) return '/user-management';
    if (/role|permission|rbac|access/.test(q)) return '/role-permissions';
    if (/banner|cms|homepage/.test(q)) return '/banner-cms';
    if (/audit|log|history|activity/.test(q)) return '/audit-logs';
    if (/setting|api|config|backup/.test(q)) return '/settings';
    return '/dashboard';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage('');
    }
  };

  const renderText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

      return (
        <span key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
              const labelMatch = part.match(/\[(.*?)\]/);
              const routeMatch = part.match(/\((.*?)\)/);
              if (labelMatch && routeMatch) {
                const label = labelMatch[1];
                const route = routeMatch[1];
                return (
                  <span
                    key={partIdx}
                    onClick={() => {
                      if (route.startsWith('/')) {
                        navigate(route);
                      }
                    }}
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: 'underline',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </span>
                );
              }
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {!open && (
        <Fade in>
          <Box
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 28,
              right: 28,
              zIndex: 1400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              px: 2.5,
              py: 1.5,
              borderRadius: '50px',
              boxShadow: '0 8px 32px rgba(27, 67, 50, 0.4)',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.04)' }
            }}
          >
            <Bot size={20} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              DelivoBot
            </Typography>
          </Box>
        </Fade>
      )}

      {open && (
        <Fade in={open}>
          <Paper
            elevation={12}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1400,
              width: { xs: 'calc(100vw - 32px)', sm: 380 },
              maxWidth: 380,
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: minimized ? 'auto' : { xs: 'calc(100vh - 96px)', sm: 540 },
              maxHeight: 620,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              transition: 'height 0.3s ease'
            }}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setMinimized(!minimized)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: 'white', width: 32, height: 32 }}>
                  <Bot size={18} color={theme.palette.primary.main} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, fontFamily: 'Outfit' }}>
                    DelivoBot
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.68rem' }}>
                      Online - LangChain backend
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <Minimize2 size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                >
                  <X size={16} />
                </IconButton>
              </Box>
            </Box>

            {!minimized && (
              <>
                <Box
                  sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    bgcolor: theme.palette.mode === 'dark' ? '#0F1923' : '#F8FAFB'
                  }}
                >
                  {messages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <Box
                        sx={{
                          maxWidth: '85%',
                          px: 2,
                          py: 1.2,
                          borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          bgcolor: msg.sender === 'user' ? 'primary.main' : (theme.palette.mode === 'dark' ? '#1E293B' : 'white'),
                          color: msg.sender === 'user' ? 'white' : 'text.primary',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          fontSize: '0.85rem',
                          lineHeight: 1.55
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.83rem', lineHeight: 1.6 }}>
                          {renderText(msg.text)}
                        </Typography>
                        
                        {msg.sender === 'bot' && msg.route && msg.route !== '/dashboard' && (
                          <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'flex-start' }}>
                            <Chip
                              label={getRouteLabel(msg.route)}
                              size="small"
                              color="primary"
                              onClick={() => navigate(msg.route!)}
                              sx={{ 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                cursor: 'pointer',
                                height: '24px',
                                border: '1px solid',
                                borderColor: 'primary.main',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(27, 67, 50, 0.2)' : 'rgba(27, 67, 50, 0.05)',
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                  color: 'white'
                                }
                              }}
                            />
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, gap: 3 }}>
                          {msg.sender === 'bot' && (msg.source || msg.latencyMs) ? (
                            <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.5, fontWeight: 500 }}>
                              {msg.source} {msg.latencyMs ? `(${msg.latencyMs}ms)` : ''}
                            </Typography>
                          ) : <Box />}
                          <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.65, textAlign: 'right' }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  {typing && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Box sx={{ px: 2, py: 1.2, borderRadius: '16px 16px 16px 4px', bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => (
                            <Box key={i} sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              animation: 'typing-dot 1.2s infinite',
                              animationDelay: `${i * 0.2}s`,
                              '@keyframes typing-dot': {
                                '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                                '40%': { transform: 'scale(1)', opacity: 1 }
                              }
                            }} />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ px: 2, py: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                  {QUICK_REPLIES.map((qr) => (
                    <Chip
                      key={qr}
                      label={qr}
                      size="small"
                      onClick={() => sendMessage(qr)}
                      disabled={typing}
                      sx={{ fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, '&:hover': { bgcolor: 'primary.main', color: 'white' }, transition: 'all 0.15s' }}
                    />
                  ))}
                </Box>

                <Box sx={{ p: 1.5, display: 'flex', gap: 1, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    disabled={typing}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '20px', fontSize: '0.85rem' }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => sendMessage('')}
                    disabled={!input.trim() || typing}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 38,
                      height: 38,
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: 'action.disabledBackground' }
                    }}
                  >
                    <Send size={16} />
                  </IconButton>
                </Box>
              </>
            )}
          </Paper>
        </Fade>
      )}
    </>
  );
};

export default ChatbotWidget;
