import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, Typography, Card, CardContent, Grid, Button,
  Chip, Rating, TextField, Divider, Paper, useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Star, MessageSquare,
  Send, CheckCircle2
} from 'lucide-react';
import { 
  RootState, addAuditLog, addNotification 
} from '../store';
import { supportService, TicketResponse, ReviewResponse } from '../services/supportService';

const ReviewsComplaints: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');

  // Ref to scroll chat to bottom
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, rRes] = await Promise.all([
        supportService.getTickets(),
        supportService.getReviews()
      ]);
      setTickets(tRes);
      setReviews(rRes);
      if (tRes.length > 0 && !activeTicketId) {
        setActiveTicketId(tRes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTicketId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Auto-scroll to bottom of chat when messages change or active ticket changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages, activeTicketId]);

  const handleToggleReviewStatus = async (id: string, name: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'Visible' ? 'Hidden' : 'Visible';
      await supportService.toggleReviewStatus(id, nextStatus);
      
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
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatMessage.trim()) return;

    try {
      await supportService.replyToTicket(activeTicket.id, chatMessage, 'support');
      
      dispatch(addAuditLog({
        username: currentUser?.email || 'Simulator Client',
        role: currentUser?.role || 'Guest',
        action: `Sent support message for ticket ${activeTicket.id}`,
        module: 'Complaints',
        ipAddress: '127.0.0.1',
        browser: 'Admin Console'
      }));

      setChatMessage('');
      fetchData();

      // Simulate customer auto reply after 3 seconds for demonstration
      setTimeout(async () => {
        try {
          await supportService.replyToTicket(activeTicket.id, 'Thank you for looking into this, I appreciate the response.', 'customer');
          fetchData();
        } catch (e) {
          console.error(e);
        }
      }, 3000);
      
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkResolved = async (ticketId: string) => {
    try {
      await supportService.resolveTicket(ticketId);
      
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
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>
          Feedback &amp; Complaint Center
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Moderate food review star ratings and chat live with clients resolving active delivery support tickets
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3.5}>
          {/* Support Tickets Live Chat Console */}
          <Grid item xs={12} lg={7}>
            <Card sx={{ display: 'flex', flexDirection: 'column' }}>
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

              <Box sx={{ display: 'flex', flexDirection: 'row', height: 500, overflow: 'hidden' }}>
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
                  {tickets.length === 0 && (
                     <Typography variant="body2" sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>No active tickets.</Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  {activeTicket ? (
                    <>
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
                                mb: 1
                              }}
                            >
                              <Paper sx={{ 
                                p: 1.5, 
                                px: 2,
                                maxWidth: '80%', 
                                borderRadius: 3,
                                bgcolor: isSupport ? 'primary.main' : 'background.paper',
                                color: isSupport ? 'primary.contrastText' : 'text.primary',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                borderTopLeftRadius: !isSupport ? 4 : 12,
                                borderTopRightRadius: isSupport ? 4 : 12
                              }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 700, color: isSupport ? 'rgba(255,255,255,0.8)' : 'text.secondary', fontSize: '0.65rem' }}>
                                  {isSupport ? 'Support Agent' : activeTicket.customerName}
                                </Typography>
                                <Typography variant="body2">{m.text}</Typography>
                              </Paper>
                            </Box>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </Box>
                      <Divider />
                      <Box component="form" onSubmit={handleSendChatMessage} sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={activeTicket.status === 'Resolved' ? 'Ticket closed. Cannot reply.' : 'Type your reply...'}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          disabled={activeTicket.status === 'Resolved'}
                          InputProps={{
                            sx: { borderRadius: 3, pr: 0.5, bgcolor: 'background.paper' },
                            endAdornment: (
                              <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={!chatMessage.trim() || activeTicket.status === 'Resolved'}
                                sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}
                              >
                                <Send size={16} />
                              </Button>
                            )
                          }}
                        />
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                      <Typography variant="body2">Select a ticket to view chat.</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Reviews Moderation */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Star size={20} color={theme.palette.warning.main} />
                  <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>
                    Latest Food Reviews
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reviews.length === 0 && (
                     <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No reviews found.</Typography>
                  )}
                  {reviews.map((r) => (
                    <Box key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.customer}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ordered: {r.dish}</Typography>
                        </Box>
                        <Chip 
                          label={r.status} 
                          size="small"
                          color={r.status === 'Visible' ? 'success' : 'default'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      
                      <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                      
                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        "{r.comment}"
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>{r.date}</Typography>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color={r.status === 'Visible' ? 'warning' : 'primary'}
                          onClick={() => handleToggleReviewStatus(r.id, r.customer, r.status)}
                          sx={{ textTransform: 'none', borderRadius: 2, py: 0.2 }}
                        >
                          {r.status === 'Visible' ? 'Hide Review' : 'Restore Visibility'}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ReviewsComplaints;
