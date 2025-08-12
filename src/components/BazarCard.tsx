import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Bazar } from '../types';

interface BazarCardProps {
  bazar: Bazar & { owner?: any };
  onClose: () => void;
  onViewProfile: () => void;
}

const BazarCard: React.FC<BazarCardProps> = ({ bazar, onClose, onViewProfile }) => {
  const owner = bazar.owner || {};
  let city = '';
  if (owner.location) {
    try {
      const loc = typeof owner.location === 'string' ? JSON.parse(owner.location) : owner.location;
      city = loc.city || '';
    } catch (e) {
      city = '';
    }
  }
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={{ fontWeight: 'bold', fontSize: 18 }}>×</Text>
      </TouchableOpacity>
      <Image source={{ uri: owner.avatar_url || bazar.imageUrl }} style={styles.avatar} />
      <Text style={styles.name}>Hi, this is {owner.name || owner.full_name || bazar.name}</Text>
      <Text style={styles.location}>{city}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={onViewProfile}>
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minHeight: 220,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    backgroundColor: '#eee',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: 'center',
    marginBottom: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  location: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#f90',
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default BazarCard; 