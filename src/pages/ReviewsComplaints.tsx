import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button,
  Chip, Rating, TextField, Divider, Paper, useTheme 
} from '@mui/material';
import { 
  Star, MessageSquare,
  Send, CheckCircle2
} from 'lucide-react';
import { 
  RootState, replyToTicket, resolveTicket, addAuditLog, addNotification 
} from '../store';

const ReviewsComplaints: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const tickets = useSelector((state: RootState) => state.db.tickets);

  const [activeTicketId, setActiveTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [chatMessage, setChatMessage] = useState('');

  // Ref to scroll chat to bottom
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local simulated reviews data
  const [reviews, setReviews] = useState([
    { id: 'rev-1', customer: 'Diana Prince', dish: 'Truffle Mushroom Burger', rating: 5, comment: 'Phenomenal burger! Truffle cream was rich and mushrooms fresh.', date: '2026-07-08', status: 'Visible' },
    { id: 'rev-2', customer: 'Clark Kent', dish: 'Spicy Pepperoni Pizza (12")', rating: 4, comment: 'Great crust, pepperoni was nice and spicy. Took slightly longer to prepare.', date: '2026-07-07', status: 'Visible' },
    { id: 'rev-3', customer: 'Steve Rogers', dish: 'Premium Veggie Salad Bowl', rating: 2, comment: 'Salad portion size was tiny for the price. Dressing was good though.', date: '2026-07-06', status: 'Visible' }
  ]);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Auto-scroll to bottom of chat when messages change or active ticket changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages, activeTicketId]);

  const handleToggleReviewStatus = (id: string, name: string) => {
    setReviews(reviews.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'Visible' ? 'Hidden' : 'Visible';
        
        dispatch(addNotification({
          title: 'Review Status Altered',
          description: `Review by ${name} set to ${nextStatus}`,
          type: 'system'
        }));

        dispatch(addAuditLog({
          username: currentUser?.email || 'Simulator Client',
          role: currentUser?.role || 'Guest',
          action: `Toggled visibility of review from ${name} (ID: ${id}) to ${nextStatus}`,
          module: 'Reviews',
          ipAddress: '127.0.0.1',
          browser: 'Admin Console'
        }));
        
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatMessage.trim()) return;

    dispatch(replyToTicket({
      ticketId: activeTicket.id,
      text: chatMessage,
      sender: 'support'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Sent support message for ticket ${activeTicket.id}`,
      module: 'Complaints',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));

    setChatMessage('');

    // Simulate customer auto reply after 3 seconds for demonstration
    setTimeout(() => {
      dispatch(replyToTicket({
        ticketId: activeTicket.id,
        text: 'Thank you for looking into this, I appreciate the response.',
        sender: 'customer'
      }));
    }, 3000);
  };

  const handleMarkResolved = (ticketId: string) => {
    dispatch(resolveTicket(ticketId));
    
    dispatch(addNotification({
      title: 'Ticket Closed',
      description: `Support ticket #${ticketId.split('-')[1]} set to Resolved`,
      type: 'ticket'
    }));

    dispatch(addAuditLog({
      username: currentUser?.email || 'Simulator Client',
      role: currentUser?.role || 'Guest',
      action: `Resolved support ticket ${ticketId}`,
      module: 'Complaints',
      ipAddress: '127.0.0.1',
      browser: 'Admin Console'
    }));
  };

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Feedback &amp; Complaint Center
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Moderate food review star ratings and chat live with clients resolving active delivery support tickets
        </Typography>
      </Box>

      <Grid container spacing={3.5}>
        {/* Support Tickets Live Chat Console */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Card header */}
            <Box sx={{ 
              p: 2.5, 
              borderBottom: `1px solid ${theme.palette.divider}`, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <MessageSquare size={20} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Support Chat Console
                </Typography>
              </Box>
              {activeTicket?.status !== 'Resolved' && activeTicket && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="success"
                  onClick={() => handleMarkResolved(activeTicket.id)}
                  startIcon={<CheckCircle2 size={13} />}
                >
                  Resolve Ticket
                </Button>
              )}
            </Box>

            {/* Chat area */}
            <Box sx={{ display: 'flex', flexDirection: 'row', height: 500, overflow: 'hidden' }}>
              {/* Tickets list sidebar */}
              <Box sx={{ 
                width: { xs: '35%', sm: '33%' }, 
                borderRight: `1px solid ${theme.palette.divider}`, 
                overflowY: 'auto',
                flexShrink: 0
              }}>
                {tickets.map((t) => (
                  <Box
                    key={t.id}
                    onClick={() => setActiveTicketId(t.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      bgcolor: activeTicketId === t.id 
                        ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') 
                        : 'transparent',
                      '&:hover': { 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' 
                      },
                      transition: 'background 0.15s'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        #{t.id.split('-')[1]}
                      </Typography>
                      <Chip 
                        label={t.priority} 
                        size="small"
                        color={t.priority === 'High' ? 'error' : t.priority === 'Medium' ? 'warning' : 'default'}
                        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{t.customerName}</Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'text.secondary', 
                      display: 'block', 
                      textOverflow: 'ellipsis', 
                      overflow: 'hidden', 
                      whiteSpace: 'nowrap',
                      fontSize: '0.7rem'
                    }}>
                      {t.issueType}
                    </Typography>
                    <Chip 
                      label={t.status} 
                      size="small"
                      color={t.status === 'Resolved' ? 'success' : t.status === 'In Progress' ? 'warning' : 'default'}
                      sx={{ height: 14, fontSize: '0.58rem', mt: 0.5 }}
                    />
                  </Box>
                ))}
              </Box>

              {/* Messages Chat box */}
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {activeTicket ? (
                  <>
                    {/* Messages scrollable area */}
                    <Box sx={{ 
                      flexGrow: 1, 
                      p: 2.5, 
                      overflowY: 'auto', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 2 
                    }}>
                      {activeTicket.messages.map((m, idx) => {
                        const isSupport = m.sender === 'support';
                        const isSystem = m.sender === 'system';
                        
                        if (isSystem) {
                          return (
                            <Typography key={idx} variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', width: '100%', fontStyle: 'italic' }}>
                              {m.text}
                            </Typography>
                          );
                        }

                        return (
                          <Box 
                            key={idx}
                            sx={{ 
                              display: 'flex', 
                              justifyContent: isSupport ? 'flex-end' : 'flex-start',
                              width: '100%'
                            }}
                          >
                            <Paper 
                              sx={{ 
                                p: 1.5, 
                                px: 2, 
                                borderRadius: isSupport ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                bgcolor: isSupport ? 'primary.main' : (theme.palette.mode === 'dark' ? '#1E293B' : '#E2E8F0'),
                                color: isSupport ? 'white' : 'text.primary',
                                maxWidth: '75%'
                              }}
                            >
                              <Typography variant="body2">{m.text}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', fontSize: '0.65rem', opacity: 0.8 }}>
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                      {/* Scroll anchor */}
                      <div ref={chatEndRef} />
                    </Box>
                    
                    <Divider />

                    {/* Message input */}
                    <Box component="form" onSubmit={handleSendChatMessage} sx={{ p: 2, display: 'flex', gap: 1, flexShrink: 0 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={activeTicket.status === 'Resolved' ? 'Ticket is resolved' : 'Type message response...'}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        disabled={activeTicket.status === 'Resolved'}
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={!chatMessage.trim() || activeTicket.status === 'Resolved'}
                        sx={{ px: 2, borderRadius: 2, minWidth: 'auto' }}
                      >
                        <Send size={16} />
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Select a ticket to begin chat</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Product Reviews Moderator list */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3.5 }}>
                <Star size={18} color={theme.palette.secondary.main} />
                <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                  Product Reviews Moderator
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {reviews.map((rev) => (
                  <Box 
                    key={rev.id} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      border: `1px solid ${theme.palette.divider}`,
                      opacity: rev.status === 'Hidden' ? 0.45 : 1,
                      transition: 'opacity 0.3s'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{rev.customer}</Typography>
                      <Rating value={rev.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', mb: 1 }}>
                      Dish: {rev.dish}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1.5 }}>
                      &ldquo;{rev.comment}&rdquo;
                    </Typography>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{rev.date}</Typography>
                        <Chip 
                          label={rev.status} 
                          size="small" 
                          color={rev.status === 'Visible' ? 'success' : 'default'}
                          sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      </Box>
                      <Button 
                        size="small" 
                        color={rev.status === 'Visible' ? 'error' : 'success'}
                        variant="outlined"
                        onClick={() => handleToggleReviewStatus(rev.id, rev.customer)}
                        sx={{ fontSize: '0.72rem', fontWeight: 700, borderRadius: 2, py: 0.25 }}
                      >
                        {rev.status === 'Visible' ? 'Hide Review' : 'Approve Show'}
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewsComplaints;
