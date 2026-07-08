import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from '@/components/chat/Avatar';
import { ArrowLeft, Shield, Users, AlertTriangle, Lock, Unlock, Eye, Ban, MessageSquareWarning, Bot } from 'lucide-react';
import AISettingsTab from '@/components/admin/AISettingsTab';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [aiSettings, setAiSettings] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allReports, allAISettings, allSecurityLogs] = await Promise.all([
        base44.entities.UserProfile.list('-
