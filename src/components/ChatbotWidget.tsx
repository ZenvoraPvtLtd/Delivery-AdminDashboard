import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, TextField, IconButton, Avatar, Chip, Fade, useTheme } from '@mui/material';
import { MessageCircle, X, Send, Bot, Minimize2 } from 'lucide-react';
import { RootState } from '../store';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

// Fast-response knowledge base — instant replies, no API needed
const getBotReply = (input: string, context: { orders: number; customers: number; partners: number }): string => {
  const q = input.toLowerCase().trim();

  if (q.match(/hello|hi|hey|namaste/)) return `👋 Hello! I'm DelivoBot, your admin assistant. I can help you with orders, customers, delivery partners, inventory, and more. What do you need?`;
  if (q.match(/order|orders/)) return `📦 You currently have **${context.orders} active orders** in the system. Go to the Orders page to manage statuses, assign riders, and process refunds.`;
  if (q.match(/customer|customers/)) return `👥 There are **${context.customers} registered customers** in the system. Use the Customers page to view profiles, adjust wallet balances, and block/unblock accounts.`;
  if (q.match(/rider|delivery partner|partners/)) return `🛵 There are **${context.partners} delivery partners** registered. You can track their live GPS, assign orders, and manage payouts from the Delivery Partners page.`;
  if (q.match(/coupon|discount|promo/)) return `🎫 You can create and manage promo codes from **Coupons & Offers** page. Expired coupons can be reactivated by toggling the switch ON again.`;
  if (q.match(/banner|cms|slide/)) return `🖼️ Go to **Banner & CMS** page to manage homepage banners. Click the Active/Paused chip to toggle banner status instantly.`;
  if (q.match(/inventory|stock|material/)) return `📋 Check the **Inventory** page for raw material stock levels. Low stock items are highlighted with red badges automatically.`;
  if (q.match(/revenue|sales|report|analytics/)) return `📊 View revenue breakdowns, outlet performance, and order analytics on the **Reports & Analytics** page.`;
  if (q.match(/wallet|credit|debit|balance/)) return `💰 Wallet adjustments can be made per customer in the **Customers** page. Open a customer profile → click "Adjust Wallet Ledger" → enter amount and description.`;
  if (q.match(/review|feedback|rating|complaint|ticket/)) return `⭐ Manage customer reviews and support tickets on the **Reviews & Feedback** page. You can reply to tickets in real-time and hide/show reviews.`;
  if (q.match(/role|permission|rbac|access/)) return `🛡️ Configure role-based access control on the **Role & Permissions** page. You can toggle individual module permissions per role.`;
  if (q.match(/login|logout|signout|session/)) return `🔐 To logout, click the red **Sign Out** button in the top navbar. Sessions auto-expire after 30 minutes of inactivity.`;
  if (q.match(/outlet|branch|store|location/)) return `🏪 Manage all outlet branches from the **Outlet Management** page. You can update outlet hours, manager info, and tax settings.`;
  if (q.match(/payment|transaction|refund/)) return `💳 View all payment transactions and process refunds from the **Payments & Wallet** page.`;
  if (q.match(/user|admin|staff|manage/)) return `👤 Add or manage admin staff accounts on the **User Management** page. Each user gets role-specific access based on RBAC settings.`;
  if (q.match(/product|menu|food|dish|item/)) return `🍔 Manage your food menu, prices, categories, and availability from the **Products** page. You can toggle availability per item instantly.`;
  if (q.match(/setting|api|config|integration/)) return `⚙️ Configure system settings, API keys, payment gateway, and backup from the **Settings & APIs** page.`;
  if (q.match(/audit|log|history|activity/)) return `📝 Review all admin actions and system changes from the **Audit Logs** page — every action is tracked with timestamp, user, and IP.`;
  if (q.match(/help|what can you do|assist/)) return `🤖 I can help you with:\n• Order management\n• Customer profiles & wallets\n• Delivery partners & GPS\n• Coupons & banners\n• Inventory & stock alerts\n• Reports & analytics\n• User roles & permissions\n\nJust ask me anything!`;
  if (q.match(/thank|thanks|ok|great|good/)) return `😊 Happy to help! Let me know if you need anything else.`;
  
  // Conversational prompts
  if (q.match(/how are you|how's it going/)) return `😊 I'm doing great! Ready to help you manage the Delivo Admin Panel. Ask me about active orders, outlet revenues, or financial settlements!`;
  if (q.match(/who are you|your name/)) return `🤖 I am **DelivoBot**, your administrative virtual helper. I am optimized to explain the admin dashboard operations and guide you through managing outlets, orders, and user access roles!`;
  if (q.match(/what is this|dashboard/)) return `📊 This is the **Delivo Admin Dashboard**, which displays live revenue metrics, kitchen prep queues, inventory status, and recent support tickets.`;
  if (q.match(/create|add/)) return `➕ To create things in this admin panel:\n• Food items: Go to **Products** page → Click "Add Product"\n• Promo coupons: Go to **Coupons** page → Click "Create Coupon"\n• Staff accounts: Go to **User Management** page → Click "Create User Account"`;
  if (q.match(/remove|delete/)) return `🗑️ To delete or revoke access:\n• Food items: Go to **Products** page → Click the Trash icon next to the item.\n• Banner slides: Go to **Banner & CMS** page → Click the Delete icon.\n• Staff accounts: Go to **User Management** page → Click the Revoke icon next to the user.`;

  return `💡 I'm here to support you with the **Delivo Admin Panel**! Regarding your query, you can explore the following modules:\n• **Dashboard**: View live metrics and the kitchen queue.\n• **Orders Desk**: Manage preparing, dispatching, and refunds.\n• **Payments**: Audit collections and export financial CSV reports.\n• **Security Logs**: View audit trails and export Excel logs.\n• **RBAC matrix**: Configure access roles and staff permissions.\n\nTell me what you'd like to do and I'll point you to the correct menu!`;
};

const QUICK_REPLIES = ['Active orders?', 'Customer count', 'Help', 'Coupons guide', 'Wallet adjustment'];

const ChatbotWidget: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `👋 Hi! I'm **DelivoBot** — your admin assistant. Ask me anything about the dashboard, orders, customers, or any feature!`,
      sender: 'bot',
      timestamp: new Date()
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = (text: string) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg: Message = { id: Date.now().toString(), text: userText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Fast reply — 150ms simulated thinking
    setTimeout(() => {
      const reply = getBotReply(userText, context);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: reply, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage('');
    }
  };

  const renderText = (text: string) => {
    // Bold **text** rendering
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Trigger Button */}
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
              '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.04)' },
              transition: 'all 0.2s ease'
            }}
          >
            <Bot size={20} />
            <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              DelivoBot
            </Typography>
          </Box>
        </Fade>
      )}

      {/* Chat Panel */}
      {open && (
        <Fade in={open}>
          <Paper
            elevation={12}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1400,
              width: 360,
              borderRadius: 4,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: minimized ? 'auto' : 520,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              transition: 'height 0.3s ease'
            }}
          >
            {/* Header */}
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
                      Online · Fast replies
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  <Minimize2 size={16} />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
                  <X size={16} />
                </IconButton>
              </Box>
            </Box>

            {!minimized && (
              <>
                {/* Messages Area */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#0F1923' : '#F8FAFB' }}>
                  {messages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <Box
                        sx={{
                          maxWidth: '82%',
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
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.3, fontSize: '0.62rem', opacity: 0.65, textAlign: 'right' }}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}

                  {/* Typing Indicator */}
                  {typing && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Box sx={{ px: 2, py: 1.2, borderRadius: '16px 16px 16px 4px', bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => (
                            <Box key={i} sx={{
                              width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main',
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

                {/* Quick Replies */}
                <Box sx={{ px: 2, py: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
                  {QUICK_REPLIES.map((qr) => (
                    <Chip
                      key={qr}
                      label={qr}
                      size="small"
                      onClick={() => sendMessage(qr)}
                      sx={{ fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, '&:hover': { bgcolor: 'primary.main', color: 'white' }, transition: 'all 0.15s' }}
                    />
                  ))}
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 1.5, display: 'flex', gap: 1, bgcolor: 'background.paper', borderTop: `1px solid ${theme.palette.divider}` }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '20px', fontSize: '0.85rem' }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => sendMessage('')}
                    disabled={!input.trim()}
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
