const express = require('express');
const router = express.Router();
const { supabase } = require('../database/init');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Please login first' });
    }
};

// GET /api/messages/unread-count - Get total unread message count
router.get('/unread-count', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
            
        if (error) throw error;
        
        res.json({ success: true, unreadCount: count || 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.json({ success: true, unreadCount: 0 });
    }
});

// GET /api/messages/conversations - Get all conversations with latest message
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Get all messages where user is sender or receiver, ordered by latest
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        // Group by conversation partner and get latest message + unread count
        const conversationMap = new Map();

        (messages || []).forEach(msg => {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

            if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            // Count unread messages sent TO current user
            if (msg.receiver_id === userId && !msg.is_read) {
                const conv = conversationMap.get(partnerId);
                conv.unreadCount++;
            }
        });

        // Fetch partner user details from Supabase
        const partnerIds = Array.from(conversationMap.keys());
        let partners = [];

        if (partnerIds.length > 0) {
            const { data: partnerData, error: partnerError } = await supabase
                .from('users')
                .select('id, first_name, middle_name, last_name, occupation_type, profile_photo')
                .in('id', partnerIds);

            if (partnerError) throw partnerError;
            partners = partnerData || [];
        }

        // Get connection statuses
        const { data: statuses, error: statusesError } = await supabase
            .from('conversation_status')
            .select('*')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (statusesError) throw statusesError;

        const statusMap = new Map();
        (statuses || []).forEach(st => {
            const partnerId = st.user1_id === userId ? st.user2_id : st.user1_id;
            statusMap.set(partnerId, st);
        });

        const conversationsList = [];
        const requestsList = [];

        // Build final arrays
        partners.forEach(partner => {
            const conv = conversationMap.get(partner.id);
            const statusRecord = statusMap.get(partner.id);
            
            let status = 'accepted';
            let actionUserId = null;
            
            if (statusRecord) {
                status = statusRecord.status;
                actionUserId = statusRecord.action_user_id;
            }

            if (status === 'denied') return; // Hide denied conversations

            const item = {
                partner: {
                    id: partner.id,
                    first_name: partner.first_name,
                    middle_name: partner.middle_name,
                    last_name: partner.last_name,
                    occupation_type: partner.occupation_type,
                    profile_photo: partner.profile_photo
                },
                lastMessage: {
                    content: conv.lastMessage.content,
                    created_at: conv.lastMessage.created_at,
                    sender_id: conv.lastMessage.sender_id
                },
                unreadCount: conv.unreadCount,
                status,
                actionUserId
            };

            if (status === 'pending' && actionUserId === userId) {
                requestsList.push(item);
            } else {
                conversationsList.push(item);
            }
        });

        // Sort by latest message time
        conversationsList.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
        requestsList.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

        res.json({ success: true, conversations: conversationsList, requests: requestsList });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ success: false, message: 'Failed to load conversations' });
    }
});

// GET /api/messages/conversation/:userId - Get full message history with a user
router.get('/conversation/:userId', requireAuth, async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const partnerId = parseInt(req.params.userId);

        if (isNaN(partnerId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        // Get partner info from Supabase
        const { data: partner, error: partnerError } = await supabase
            .from('users')
            .select('id, first_name, middle_name, last_name, occupation_type, profile_photo')
            .eq('id', partnerId)
            .single();

        if (partnerError || !partner) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get conversation status
        const user1_id = Math.min(currentUserId, partnerId);
        const user2_id = Math.max(currentUserId, partnerId);
        
        const { data: statusRecord, error: statusError } = await supabase
            .from('conversation_status')
            .select('*')
            .eq('user1_id', user1_id)
            .eq('user2_id', user2_id)
            .maybeSingle();

        let status = 'accepted';
        let actionUserId = null;
        if (statusRecord) {
            status = statusRecord.status;
            actionUserId = statusRecord.action_user_id;
        }

        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        res.json({
            success: true,
            partner,
            messages: messages || [],
            status,
            actionUserId
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ success: false, message: 'Failed to load conversation' });
    }
});

// POST /api/messages/send - Send a message
router.post('/send', requireAuth, async (req, res) => {
    try {
        const senderId = req.session.userId;
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ success: false, message: 'Receiver and message content are required' });
        }

        if (content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Message cannot be empty' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ success: false, message: 'Message is too long (max 2000 characters)' });
        }

        if (parseInt(receiverId) === senderId) {
            return res.status(400).json({ success: false, message: 'Cannot send message to yourself' });
        }

        // Verify receiver exists in Supabase
        const { data: receiver, error: receiverError } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .eq('id', parseInt(receiverId))
            .single();

        if (receiverError || !receiver) {
            return res.status(404).json({ success: false, message: 'Recipient not found' });
        }

        // Check conversation status
        const user1_id = Math.min(senderId, parseInt(receiverId));
        const user2_id = Math.max(senderId, parseInt(receiverId));

        const { data: existingStatus } = await supabase
            .from('conversation_status')
            .select('status')
            .eq('user1_id', user1_id)
            .eq('user2_id', user2_id)
            .maybeSingle();

        if (!existingStatus) {
            await supabase.from('conversation_status').insert({
                user1_id,
                user2_id,
                status: 'pending',
                action_user_id: parseInt(receiverId),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        } else if (existingStatus.status === 'denied') {
            // Silently act as if sent to avoid telling the sender they are blocked
            const mockMessage = { sender_id: senderId, receiver_id: parseInt(receiverId), content: content.trim(), created_at: new Date().toISOString() };
            return res.json({ success: true, message: mockMessage });
        }

        // Insert message in Supabase
        const { data: message, error: insertError } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: parseInt(receiverId),
                content: content.trim(),
                is_read: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (insertError) throw insertError;

        res.json({ success: true, message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// PUT /api/messages/read/:userId - Mark all messages from a user as read
router.put('/read/:userId', requireAuth, async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const senderId = parseInt(req.params.userId);

        if (isNaN(senderId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', senderId)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
    }
});

// POST /api/messages/request/:action/:partnerId - Allow or deny a message request
router.post('/request/:action/:partnerId', requireAuth, async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const partnerId = parseInt(req.params.partnerId);
        const action = req.params.action;

        if (isNaN(partnerId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        if (action !== 'allow' && action !== 'deny') {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        const user1_id = Math.min(currentUserId, partnerId);
        const user2_id = Math.max(currentUserId, partnerId);

        const { data: statusRecord } = await supabase
            .from('conversation_status')
            .select('*')
            .eq('user1_id', user1_id)
            .eq('user2_id', user2_id)
            .maybeSingle();

        if (!statusRecord || statusRecord.action_user_id !== currentUserId || statusRecord.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'No pending request found' });
        }

        const newStatus = action === 'allow' ? 'accepted' : 'denied';
        
        await supabase
            .from('conversation_status')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('user1_id', user1_id)
            .eq('user2_id', user2_id);
        
        // If denied, mark all messages as read so they don't count towards unread
        if (newStatus === 'denied') {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', partnerId)
                .eq('receiver_id', currentUserId)
                .eq('is_read', false);
        }

        res.json({ success: true, message: `Request ${action}ed successfully` });
    } catch (error) {
        console.error('Request action error:', error);
        res.status(500).json({ success: false, message: 'Failed to complete request action' });
    }
});

module.exports = router;
