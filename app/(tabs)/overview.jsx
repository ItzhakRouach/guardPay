import { View ,StyleSheet , ScrollView } from 'react-native'
import { Text ,useTheme , Surface , IconButton , Divider , Card} from 'react-native-paper'
import { useState , useEffect , useMemo } from 'react';
import MonthPicker from '../components/MonthPicker';
import { calculateSalary } from '../../lib/salary_calculation';
import { useAuth } from '../../lib/auth-context';
import { DATABASE_ID , databases , SHIFTS_HISTORY  } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';




export default function OverViewScreen(){
    const [shifts , setShifts] = useState([])
    const [currentDate , setCurrentDate ] = useState(new Date())
    const [loading , setLoading] = useState(false)
    const { user } = useAuth()

 const totals = useMemo(() => {
  const regPay = shifts.reduce((sum, s) => sum + Number(s.reg_pay_amount || 0), 0);
  const extraPay = shifts.reduce((sum, s) => sum + Number(s.extra_pay_amount || 0), 0);
  const travelPay = shifts.reduce((sum, s) => sum + Number(s.travel_pay_amount || 0), 0);
  const reg = shifts.reduce((sum,s)=>sum + Number(s.reg_hours || 0) , 0 )
  const extra = shifts.reduce((sum,s)=>sum + Number(s.extra_hours || 0) , 0 )
  const monthyReport = calculateSalary(regPay,extraPay,travelPay)

  return {
    monthlyRegPay: regPay,
    monthlyExtraPay: extraPay,
    monthlyTravelPay: travelPay,
    monthlyReport: monthyReport,
    totalReg: reg,
    totalExtra: extra
  };
}, [shifts]);

const totalShift = useMemo(() => {
  return Array.isArray(shifts) ? shifts.length : 0;
}, [shifts]);


     // run each time the month is changed , to fetch the shifs from that month
      const fetchShifts = async () => {
        if (!user) return;
        try {
          const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
          ).toISOString();
          const endOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
            23,
            59,
            59
          ).toISOString();
    
          const response = await databases.listDocuments(
            DATABASE_ID,
            SHIFTS_HISTORY,
            [
              Query.equal("user_id", user.$id),
              Query.between("start_time", startOfMonth, endOfMonth),
              Query.orderAsc("start_time"),
            ]
          );
          setShifts(response.documents || []);
          setLoading(false);
        } catch (err) {
          console.log(err);
          setShifts([]);
        }
      };

    // intilize styles 
    const theme = useTheme()
    const styles = makeStyle(theme)


    // run each time current date change
      useEffect(() => {
        fetchShifts();
      },[currentDate]);

    return(
        <View style={styles.container}>
            <MonthPicker currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <Surface elevation={1} style={styles.contentSurface}>
                <View style={styles.salaryContent}>
                    <Text variant='bodyLarge' style={styles.field}>
                        Bruto Income:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.income}>
                        {totals.monthlyReport.bruto}$
                    </Text>
                </View>
                <Divider style={styles.dividerStyle}/>
                <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                      Shifts Worked:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.shiftsField}>
                        {totalShift}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                 <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                       Total Regular Hours:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.shiftsField}>
                        {totals.totalReg}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                 <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                        Total Extra Hours:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.shiftsField}>
                        {totals.totalExtra}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                  <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                       Travel Money:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.income}>
                        {totals.monthlyTravelPay}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                 <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                        Regualr Hours Money:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.income}>
                        {totals.monthlyRegPay}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle} />
                 <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                        Extra Hours Money:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.income}>
                        {totals.monthlyExtraPay}
                    </Text>
                </View>
                <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                       Bituah Leumi and Health: 
                    </Text>
                    <Text variant='bodyLarge' style={styles.expense}>
                        {totals.monthlyReport.bituahLeumiAndHealth.toFixed(2)}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                  <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                      Pensia:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.expense}>
                        {totals.monthlyReport.pensia.toFixed(2)}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                  <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                       Tax:
                    </Text>
                    <Text variant='bodyLarge' style={styles.expense}>
                        {totals.monthlyReport.incomeTax.toFixed(2)}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
                  <View style={styles.salaryContent}>
                    <Text variant='bodyLarge'  style={styles.field}>
                       Total Dedaction:  
                    </Text>
                    <Text variant='bodyLarge' style={styles.expense}>
                        {totals.monthlyReport.totalDeductions.toFixed(2)}
                    </Text>
                </View>
                  <Divider style={styles.dividerStyle}/>
            </Surface>
            <Card style={styles.netoContainer}>
                <Card.Content style={styles.cardStyle}>
                    <View>
                        <Text variant='bodyLarge' style={styles.netoField} >Neto</Text>
                    </View>
                    <View>
                        <Text variant='bodyLarge' style={styles.income}>{totals.monthlyReport.neto.toFixed(2)} $</Text>

                    </View>
                </Card.Content>
            </Card>
        </View>
    )
}

const makeStyle = (theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 10,
      background: theme.colors.background
    },

    contentSurface:{
        marginTop:20,
        padding:10,
        marginHorizontal:10,
        backgroundColor:theme.colors.surface,
        borderRadius:20
    },  
    salaryContent:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",
        gap:20,
        marginBottom:10,
        
    },
    dividerStyle:{
        marginBottom:10
    },
    netoContainer:{
        marginTop:40,
        backgroundColor:theme.colors.surface,
        padding:10,
        marginHorizontal:20
    },
    cardStyle:{
        flexDirection:"row",
        justifyContent:"space-between",
    },
    field:{
        fontWeight:"600",
        marginLeft:10,
        color:theme.colors.primary
    },
    shiftsField:{
        fontWeight:"bold",
        marginRight:10
    },
    income:{
        fontWeight:"bold",
        color:"#466644",
        marginRight:10
    },
    expense:{
        fontWeight:"bold",
        color:	"#963a34",
        marginRight:10
    },
    netoField:{
        fontWeight:"bold",
        marginLeft: 50,
        color:theme.colors.primary
    }

    

})