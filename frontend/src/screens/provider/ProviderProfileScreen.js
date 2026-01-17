import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { NavHeader, Card, Button, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * PANTALLA PERFIL DEL PROVEEDOR
 * Funcionalidades:
 * - Información personal y profesional
 * - Especialidades y certificaciones
 * - Portfolio de trabajos realizados
 * - Calificaciones y reseñas
 * - Configuración de tarifas
 * - Documentos y verificaciones
 * - Estadísticas de rendimiento
 */
const ProviderProfileScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal'); // personal, professional, portfolio, reviews
  const [editing, setEditing] = useState(false);
  
  // Estados del perfil
  const [personalInfo, setPersonalInfo] = useState({});
  const [professionalInfo, setProfessionalInfo] = useState({});
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [certifications, setCertifications] = useState([]);

  // Mock data del proveedor
  const mockProviderData = {
    personal: {
      id: 'PROV-12345',
      firstName: 'María Elena',
      lastName: 'Rodríguez García',
      email: 'maria.rodriguez@homecare.com',
      phone: '+57 300 123 4567',
      address: 'Calle 72 #11-45, Chapinero, Bogotá',
      birthDate: '1985-03-15',
      identification: '52.123.456',
      photo: 'https://via.placeholder.com/150/49C0BC/FFFFFF?text=MR',
      joinDate: '2023-01-15',
      status: 'VERIFIED',
    },
    professional: {
      specialties: [
        { id: 'home_cleaning', name: 'Limpieza de Hogar', certified: true, experience: 5 },
        { id: 'office_cleaning', name: 'Limpieza de Oficina', certified: true, experience: 3 },
        { id: 'deep_cleaning', name: 'Limpieza Profunda', certified: false, experience: 2 },
        { id: 'post_construction', name: 'Post-Construcción', certified: true, experience: 4 },
      ],
      languages: ['Español (Nativo)', 'Inglés (Básico)'],
      workRadius: 15, // km
      transportation: 'own_vehicle',
      availability: 'full_time',
      hourlyRate: {
        home_cleaning: 25000,
        office_cleaning: 30000,
        deep_cleaning: 35000,
        post_construction: 40000,
      },
      bio: 'Profesional en limpieza con más de 5 años de experiencia. Especializada en limpieza de hogar y oficinas. Comprometida con la calidad y satisfacción del cliente.',
      equipment: [
        'Aspiradora profesional',
        'Kit de productos de limpieza',
        'Herramientas especializadas',
        'Equipo de protección personal',
      ],
    },
    statistics: {
      totalJobs: 342,
      completedJobs: 338,
      canceledJobs: 4,
      averageRating: 4.8,
      totalEarnings: 12500000,
      repeatClients: 65,
      onTimeDelivery: 96.5,
      responseTime: '2 min promedio',
    },
    certifications: [
      {
        id: 'CERT-001',
        name: 'Certificación en Limpieza Profesional',
        issuer: 'Instituto Nacional de Limpieza',
        date: '2023-06-15',
        expires: '2025-06-15',
        status: 'ACTIVE',
        document: 'cert_limpieza_prof.pdf',
      },
      {
        id: 'CERT-002',
        name: 'Manejo Seguro de Productos Químicos',
        issuer: 'SENA',
        date: '2023-03-20',
        expires: '2026-03-20',
        status: 'ACTIVE',
        document: 'cert_productos_quimicos.pdf',
      },
      {
        id: 'CERT-003',
        name: 'Primeros Auxilios',
        issuer: 'Cruz Roja Colombiana',
        date: '2023-01-10',
        expires: '2025-01-10',
        status: 'ACTIVE',
        document: 'cert_primeros_auxilios.pdf',
      },
    ],
  };

  const mockPortfolio = [
    {
      id: 'PORT-001',
      title: 'Limpieza Oficina Corporativa',
      description: 'Limpieza completa de oficina de 200m² incluyendo áreas comunes y privadas',
      images: [
        'https://via.placeholder.com/300x200/49C0BC/FFFFFF?text=Antes',
        'https://via.placeholder.com/300x200/001B38/FFFFFF?text=Después',
      ],
      date: '2024-01-10',
      client: 'Empresa XYZ',
      rating: 5,
      tags: ['Oficina', 'Corporativo', 'Limpieza Profunda'],
    },
    {
      id: 'PORT-002',
      title: 'Apartamento Post-Remodelación',
      description: 'Limpieza post-construcción de apartamento recién remodelado',
      images: [
        'https://via.placeholder.com/300x200/49C0BC/FFFFFF?text=Antes',
        'https://via.placeholder.com/300x200/001B38/FFFFFF?text=Después',
      ],
      date: '2024-01-05',
      client: 'Carlos Méndez',
      rating: 5,
      tags: ['Hogar', 'Post-Construcción', 'Remodelación'],
    },
    {
      id: 'PORT-003',
      title: 'Casa Familiar Completa',
      description: 'Limpieza semanal de casa de 3 pisos con jardín y garaje',
      images: [
        'https://via.placeholder.com/300x200/49C0BC/FFFFFF?text=Cocina',
        'https://via.placeholder.com/300x200/001B38/FFFFFF?text=Baños',
        'https://via.placeholder.com/300x200/49C0BC/FFFFFF?text=Jardín',
      ],
      date: '2023-12-20',
      client: 'Familia González',
      rating: 4.8,
      tags: ['Hogar', 'Familia', 'Recurrente'],
    },
  ];

  const mockReviews = [
    {
      id: 'REV-001',
      client: 'Ana María Torres',
      rating: 5,
      comment: 'Excelente trabajo! María es muy profesional y detallista. Mi oficina quedó impecable. Definitivamente la recomendaré.',
      date: '2024-01-12',
      service: 'Limpieza de Oficina',
      verified: true,
    },
    {
      id: 'REV-002',
      client: 'Carlos Méndez',
      rating: 5,
      comment: 'Muy satisfecho con el servicio post-construcción. Removió todo el polvo y escombros, dejó la casa perfecta para habitar.',
      date: '2024-01-06',
      service: 'Post-Construcción',
      verified: true,
    },
    {
      id: 'REV-003',
      client: 'Empresa ABC',
      rating: 4,
      comment: 'Buen servicio en general, puntual y eficiente. Solo un pequeño detalle en la cocina que se solucionó rápidamente.',
      date: '2023-12-28',
      service: 'Limpieza de Oficina',
      verified: true,
    },
    {
      id: 'REV-004',
      client: 'Laura Jiménez',
      rating: 5,
      comment: 'María es fantástica! Siempre llega a tiempo y hace un trabajo impecable. Mi casa queda brillante cada vez.',
      date: '2023-12-15',
      service: 'Limpieza de Hogar',
      verified: true,
    },
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPersonalInfo(mockProviderData.personal);
      setProfessionalInfo(mockProviderData.professional);
      setStatistics(mockProviderData.statistics);
      setCertifications(mockProviderData.certifications);
      setPortfolio(mockPortfolio);
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProfileData().finally(() => setRefreshing(false));
  }, []);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const renderTab = (tabKey, label, icon) => (
    <TouchableOpacity
      key={tabKey}
      style={[
        styles.tab,
        activeTab === tabKey && styles.tabActive,
      ]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[
        styles.tabText,
        activeTab === tabKey && styles.tabTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPersonalInfo = () => (
    <View style={styles.tabContent}>
      {/* Foto y Info Básica */}
      <Card style={styles.basicInfoCard}>
        <View style={styles.photoSection}>
          <Image source={{ uri: personalInfo.photo }} style={styles.profilePhoto} />
          <TouchableOpacity style={styles.editPhotoButton}>
            <Text style={styles.editPhotoIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.basicInfo}>
          <Text style={styles.providerName}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          <Text style={styles.providerId}>ID: {personalInfo.id}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✅ Verificado</Text>
          </View>
        </View>
      </Card>

      {/* Información Personal */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>📋 Información Personal</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{personalInfo.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoValue}>{personalInfo.phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue}>{personalInfo.address}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cédula:</Text>
          <Text style={styles.infoValue}>{personalInfo.identification}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Miembro desde:</Text>
          <Text style={styles.infoValue}>{personalInfo.joinDate}</Text>
        </View>
      </Card>

      {/* Estadísticas Rápidas */}
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>📊 Estadísticas</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalJobs}</Text>
            <Text style={styles.statLabel}>Trabajos</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>⭐ {statistics.averageRating}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.repeatClients}</Text>
            <Text style={styles.statLabel}>Clientes Recurrentes</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.onTimeDelivery}%</Text>
            <Text style={styles.statLabel}>Puntualidad</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.tabContent}>
      {/* Especialidades */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>🏠 Especialidades</Text>
        
        {professionalInfo.specialties?.map((specialty, index) => (
          <View key={index} style={styles.specialtyItem}>
            <View style={styles.specialtyInfo}>
              <Text style={styles.specialtyName}>{specialty.name}</Text>
              <Text style={styles.specialtyExperience}>
                {specialty.experience} años de experiencia
              </Text>
            </View>
            
            <View style={styles.specialtyBadges}>
              {specialty.certified && (
                <View style={styles.certifiedBadge}>
                  <Text style={styles.certifiedText}>✓ Certificado</Text>
                </View>
              )}
              <Text style={styles.specialtyRate}>
                {formatCurrency(professionalInfo.hourlyRate?.[specialty.id] || 0)}/h
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Biografía Profesional */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>👤 Acerca de Mí</Text>
        <Text style={styles.bioText}>{professionalInfo.bio}</Text>
      </Card>

      {/* Información Adicional */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>ℹ️ Información Adicional</Text>
        
        <View style={styles.additionalInfo}>
          <View style={styles.additionalItem}>
            <Text style={styles.additionalLabel}>🌍 Idiomas:</Text>
            <Text style={styles.additionalValue}>
              {professionalInfo.languages?.join(', ')}
            </Text>
          </View>
          
          <View style={styles.additionalItem}>
            <Text style={styles.additionalLabel}>📍 Radio de trabajo:</Text>
            <Text style={styles.additionalValue}>
              {professionalInfo.workRadius} km
            </Text>
          </View>
          
          <View style={styles.additionalItem}>
            <Text style={styles.additionalLabel}>🚗 Transporte:</Text>
            <Text style={styles.additionalValue}>
              Vehículo propio
            </Text>
          </View>
          
          <View style={styles.additionalItem}>
            <Text style={styles.additionalLabel}>⏰ Disponibilidad:</Text>
            <Text style={styles.additionalValue}>
              Tiempo completo
            </Text>
          </View>
        </View>
      </Card>

      {/* Equipos */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>🧰 Equipos y Herramientas</Text>
        
        {professionalInfo.equipment?.map((item, index) => (
          <View key={index} style={styles.equipmentItem}>
            <Text style={styles.equipmentIcon}>✓</Text>
            <Text style={styles.equipmentText}>{item}</Text>
          </View>
        ))}
      </Card>
    </View>
  );

  const renderPortfolioItem = ({ item }) => (
    <Card style={styles.portfolioCard}>
      <View style={styles.portfolioHeader}>
        <View style={styles.portfolioInfo}>
          <Text style={styles.portfolioTitle}>{item.title}</Text>
          <Text style={styles.portfolioClient}>Cliente: {item.client}</Text>
          <Text style={styles.portfolioDate}>📅 {item.date}</Text>
        </View>
        
        <View style={styles.portfolioRating}>
          <Text style={styles.ratingValue}>⭐ {item.rating}</Text>
        </View>
      </View>
      
      <Text style={styles.portfolioDescription}>{item.description}</Text>
      
      <ScrollView horizontal style={styles.portfolioImages}>
        {item.images.map((image, index) => (
          <Image key={index} source={{ uri: image }} style={styles.portfolioImage} />
        ))}
      </ScrollView>
      
      <View style={styles.portfolioTags}>
        {item.tags.map((tag, index) => (
          <View key={index} style={styles.portfolioTag}>
            <Text style={styles.portfolioTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderReviewItem = ({ item }) => (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewClient}>
          <Text style={styles.reviewClientName}>
            {item.client}
            {item.verified && <Text style={styles.verifiedIcon}> ✅</Text>}
          </Text>
          <Text style={styles.reviewService}>{item.service}</Text>
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        
        <View style={styles.reviewRating}>
          <Text style={styles.reviewStars}>
            {'⭐'.repeat(Math.floor(item.rating))}
          </Text>
          <Text style={styles.reviewRatingValue}>({item.rating})</Text>
        </View>
      </View>
      
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </Card>
  );

  const renderCertificationItem = ({ item }) => (
    <Card style={styles.certificationCard}>
      <View style={styles.certificationHeader}>
        <View style={styles.certificationInfo}>
          <Text style={styles.certificationName}>{item.name}</Text>
          <Text style={styles.certificationIssuer}>Emisor: {item.issuer}</Text>
        </View>
        
        <View style={[
          styles.certificationStatus,
          { backgroundColor: item.status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.WARNING }
        ]}>
          <Text style={styles.certificationStatusText}>
            {item.status === 'ACTIVE' ? 'ACTIVO' : 'VENCIDO'}
          </Text>
        </View>
      </View>
      
      <View style={styles.certificationDates}>
        <Text style={styles.certificationDate}>📅 Emitido: {item.date}</Text>
        <Text style={styles.certificationDate}>⏰ Vence: {item.expires}</Text>
      </View>
      
      <TouchableOpacity style={styles.viewDocumentButton}>
        <Text style={styles.viewDocumentText}>📄 Ver Documento</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Mi Perfil"
        onBack={() => navigation.goBack()}
        actions={
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editIcon}>{editing ? '💾' : '✏️'}</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <ScrollView horizontal style={styles.tabsContainer} showsHorizontalScrollIndicator={false}>
        {renderTab('personal', 'Personal', '👤')}
        {renderTab('professional', 'Profesional', '💼')}
        {renderTab('portfolio', 'Portfolio', '📸')}
        {renderTab('reviews', 'Reseñas', '⭐')}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'professional' && renderProfessionalInfo()}
        
        {activeTab === 'portfolio' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📸 Mi Portfolio</Text>
              <Button
                title="Agregar"
                variant="outline"
                size="small"
                onPress={() => navigation.navigate('AddPortfolioItem')}
              />
            </View>
            
            <FlatList
              data={portfolio}
              renderItem={renderPortfolioItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
        
        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>⭐ Mis Reseñas</Text>
            
            {/* Resumen de Calificaciones */}
            <Card style={styles.reviewsSummary}>
              <Text style={styles.averageRating}>
                ⭐ {statistics.averageRating}
              </Text>
              <Text style={styles.totalReviews}>
                {reviews.length} reseñas
              </Text>
              
              <View style={styles.ratingBreakdown}>
                {[5, 4, 3, 2, 1].map(stars => (
                  <View key={stars} style={styles.ratingRow}>
                    <Text style={styles.ratingStars}>{stars}⭐</Text>
                    <View style={styles.ratingBar}>
                      <View
                        style={[
                          styles.ratingFill,
                          {
                            width: `${(reviews.filter(r => Math.floor(r.rating) === stars).length / reviews.length) * 100}%`
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingCount}>
                      {reviews.filter(r => Math.floor(r.rating) === stars).length}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
            
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Certificaciones (siempre visible) */}
        <View style={styles.certificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Certificaciones</Text>
            <Button
              title="Subir"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate('UploadCertification')}
            />
          </View>
          
          <FlatList
            data={certifications}
            renderItem={renderCertificationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Button
            title="Configuración de Perfil"
            onPress={() => navigation.navigate('ProfileSettings')}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          
          <Button
            title="Verificación de Identidad"
            onPress={() => navigation.navigate('IdentityVerification')}
            variant="primary"
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  editIcon: {
    fontSize: 20,
  },
  
  // Tabs
  tabsContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    maxHeight: 60,
  },
  
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  
  tabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  tabIcon: {
    fontSize: 16,
    marginRight: SPACING.SM,
  },
  
  tabText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
  },
  
  tabTextActive: {
    color: COLORS.WHITE,
  },
  
  tabContent: {
    paddingTop: SPACING.MD,
  },
  
  // Información básica
  basicInfoCard: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  
  photoSection: {
    position: 'relative',
    marginBottom: SPACING.MD,
  },
  
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.PRIMARY,
  },
  
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  editPhotoIcon: {
    fontSize: 18,
  },
  
  basicInfo: {
    alignItems: 'center',
  },
  
  providerName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  providerId: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.SM,
  },
  
  statusBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.LG,
  },
  
  statusText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
  },
  
  // Cards de información
  infoCard: {
    marginBottom: SPACING.MD,
  },
  
  cardTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  
  infoLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  
  infoValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  
  // Estadísticas
  statsCard: {
    marginBottom: SPACING.MD,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  
  // Especialidades
  specialtyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  
  specialtyInfo: {
    flex: 1,
  },
  
  specialtyName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  specialtyExperience: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  specialtyBadges: {
    alignItems: 'flex-end',
  },
  
  certifiedBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.XS,
  },
  
  certifiedText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },
  
  specialtyRate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  
  // Biografía
  bioText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    lineHeight: 20,
  },
  
  // Información adicional
  additionalInfo: {
    marginTop: SPACING.SM,
  },
  
  additionalItem: {
    marginBottom: SPACING.MD,
  },
  
  additionalLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  additionalValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  // Equipos
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  
  equipmentIcon: {
    color: COLORS.SUCCESS,
    marginRight: SPACING.SM,
    fontWeight: '600',
  },
  
  equipmentText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
  },
  
  // Portfolio
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
  },
  
  portfolioCard: {
    marginBottom: SPACING.MD,
  },
  
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  portfolioInfo: {
    flex: 1,
  },
  
  portfolioTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  portfolioClient: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  portfolioDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  portfolioRating: {
    marginLeft: SPACING.MD,
  },
  
  ratingValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
  },
  
  portfolioDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
    lineHeight: 18,
  },
  
  portfolioImages: {
    marginBottom: SPACING.MD,
  },
  
  portfolioImage: {
    width: 150,
    height: 100,
    borderRadius: BORDER_RADIUS.MD,
    marginRight: SPACING.SM,
  },
  
  portfolioTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  portfolioTag: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  
  portfolioTagText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },
  
  // Reseñas
  reviewsSummary: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  
  averageRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XXL,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  totalReviews: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
  },
  
  ratingBreakdown: {
    width: '100%',
    marginTop: SPACING.MD,
  },
  
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  ratingStars: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    width: 40,
  },
  
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 4,
    marginHorizontal: SPACING.SM,
    overflow: 'hidden',
  },
  
  ratingFill: {
    height: '100%',
    backgroundColor: COLORS.WARNING,
  },
  
  ratingCount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    width: 20,
    textAlign: 'right',
  },
  
  reviewCard: {
    marginBottom: SPACING.MD,
  },
  
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  reviewClient: {
    flex: 1,
  },
  
  reviewClientName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  verifiedIcon: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
  
  reviewService: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  reviewDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  reviewRating: {
    alignItems: 'flex-end',
    marginLeft: SPACING.MD,
  },
  
  reviewStars: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
  
  reviewRatingValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  reviewComment: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    lineHeight: 18,
  },
  
  // Certificaciones
  certificationsSection: {
    paddingTop: SPACING.LG,
  },
  
  certificationCard: {
    marginBottom: SPACING.MD,
  },
  
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  certificationInfo: {
    flex: 1,
  },
  
  certificationName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  certificationIssuer: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  certificationStatus: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.MD,
  },
  
  certificationStatusText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },
  
  certificationDates: {
    marginBottom: SPACING.MD,
  },
  
  certificationDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  viewDocumentButton: {
    alignSelf: 'flex-start',
  },
  
  viewDocumentText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  // Acciones
  actionsSection: {
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  
  actionButton: {
    marginBottom: SPACING.MD,
  },
});

export default ProviderProfileScreen;