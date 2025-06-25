import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity, // More customizable button
    ScrollView, // Use ScrollView for chat
    KeyboardAvoidingView,
    Platform,
    Dimensions // To get screen height
} from 'react-native';
import { Merchant, Message } from '../types';

interface SidebarProps {
    selectedMerchant: Merchant | null;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedMerchant }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Effect to reset chat when merchant changes
    useEffect(() => {
        if (selectedMerchant) {
            setMessages([
                { id: Date.now().toString(), text: `Connected to ${selectedMerchant.name}. Ask away!`, type: 'system' }
            ]);
            setInputText('');
            setIsReplying(false);
        } else {
            setMessages([]); // Clear messages if no merchant selected
        }
    }, [selectedMerchant]);


    const addMessage = (text: string, type: Message['type']) => {
        const newMessage: Message = {
            id: Date.now().toString() + Math.random(), // Simple unique ID
            text,
            type,
        };
        setMessages(prev => [...prev, newMessage]);
        // Scroll to bottom after adding message (with slight delay)
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    };

    const handleSend = () => {
        if (!inputText.trim() || !selectedMerchant || isReplying) return;
        addMessage(inputText, 'user');
        simulateReply(selectedMerchant.name);
        setInputText('');
    };

    const simulateReply = (merchantName: string) => {
        setIsReplying(true);
        addMessage("...", 'merchant'); // Typing indicator

        setTimeout(() => {
            // Remove typing indicator (find last message and check text)
            setMessages(prev => {
                // --- DEBUG LOG ---
                console.log('Inside setMessages for filter. Type of prev:', typeof prev, 'Is Array:', Array.isArray(prev), 'Value:', prev);
                // --- ----------- ---

                // Add a safety check before filtering
                if (!Array.isArray(prev)) {
                    console.error("ERROR: Previous messages state is not an array! Cannot filter.", prev);
                    // Decide how to recover - maybe return an empty array or the invalid value?
                    // Returning empty array is safest to prevent crash, but hides the root cause.
                    return [];
                }

                // Original filter logic
                return prev.filter((msg, index) => !(index === prev.length - 1 && msg.text === '...'));
            });
            const replies = [
                "Thanks for asking!", "Let me check on that...", `Hello from ${merchantName}!`, "Got it!", "How can I help further?"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            addMessage(randomReply, 'merchant');
            setIsReplying(false);
        }, 1500 + Math.random() * 1000);
    };


    if (!selectedMerchant) {
        return (
            <View style={[styles.container, styles.defaultView]}>
                <Text style={styles.defaultText}>Click a marker to see details.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust offset if needed
        >
            {/* Merchant Details */}
            <View style={styles.detailsSection}>
                <Text style={styles.merchantName}>{selectedMerchant.name}</Text>
                <Text style={styles.merchantDesc}>{selectedMerchant.description}</Text>
            </View>

            {/* Chat Messages */}
            <ScrollView
                style={styles.messageList}
                ref={scrollViewRef}
                contentContainerStyle={{ paddingBottom: 10 }} // Ensure scroll content padding
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} // Scroll on size change
                onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: true })} // Scroll on initial layout
            >
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        style={[
                            styles.messageBubble,
                            msg.type === 'user' && styles.userBubble,
                            msg.type === 'merchant' && styles.merchantBubble,
                            msg.type === 'system' && styles.systemBubble,
                            msg.type === 'error' && styles.errorBubble,
                        ]}
                    >
                        <Text style={[
                            styles.messageText,
                            msg.type === 'user' ? styles.userText : styles.merchantText,
                            (msg.type === 'system' || msg.type === 'error') ? styles.systemText : null,
                        ]}>
                            {msg.text}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            {/* Message Input Area */}
            <View style={styles.inputArea}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type message..."
                    editable={!isReplying} // Disable while "replying"
                    onSubmitEditing={handleSend} // Allow sending via keyboard return key
                    blurOnSubmit={false} // Keep keyboard potentially open
                />
                <TouchableOpacity
                    style={[styles.sendButton, (isReplying || !inputText.trim()) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={isReplying || !inputText.trim()}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

// Get screen height for potential layout adjustments
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        width: '100%', // Take full width if used alone, or set fixed width if part of layout
        height: screenHeight * 0.5, // Example: take 40% of screen height - ADJUST AS NEEDED
        backgroundColor: '#f8f8f8',
        borderTopWidth: 1, // Or Left width depending on layout
        borderTopColor: '#ccc',
        flexDirection: 'column',
    },
    defaultView: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    defaultText: {
        color: '#888',
        fontSize: 16,
    },
    detailsSection: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    merchantName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    merchantDesc: {
        fontSize: 14,
        color: '#666',
    },
    messageList: {
        flex: 1, // Take remaining space
        padding: 10,
        backgroundColor: '#e9e9e9',
    },
    messageBubble: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        marginBottom: 8,
        maxWidth: '80%', // Prevent bubbles becoming too wide
    },
    userBubble: {
        backgroundColor: '#dcf8c6',
        alignSelf: 'flex-end', // Align right
    },
    merchantBubble: {
        backgroundColor: '#ffffff',
        alignSelf: 'flex-start', // Align left
    },
    systemBubble: {
        alignSelf: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 4,
    },
    errorBubble: {
        alignSelf: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 4,
    },
    messageText: {
        fontSize: 15,
    },
    userText: {
        color: '#000',
    },
    merchantText: {
        color: '#000',
    },
    systemText: {
        color: '#555',
        fontStyle: 'italic',
        fontSize: 12,
    },
    inputArea: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#f0f0f0',
        alignItems: 'center', // Align items vertically
    },
    textInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20, // Rounded input
        paddingHorizontal: 15,
        marginRight: 10,
        backgroundColor: '#fff',
    },
    sendButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20, // Rounded button
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Sidebar;