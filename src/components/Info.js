import React, { Component } from "react";
import { View, Text, StyleSheet } from "react-native";


export default class Info extends Component{
 
    render(props){
        return(
            <View style={styles.container}>
                <View style={styles.innerContainer}>
                    <Text>Teste</Text>
                </View>            
            </View>
            
        )
    }
}

const styles = StyleSheet.create({
    container: {    
        flex: 1,       
        position: 'absolute',                               
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    innerContainer: {
        backgroundColor: '#E3E3E3',        
        width: '90%',
        height: '90%',
        borderRadius: 5,
        padding: 10,
    }    
})