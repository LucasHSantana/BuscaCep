/*
    Para utilizar este componente é necessário passar as cores corretamente.
    props:
        color_header: É a cor do header em si
        color_content: É a cor do restante da página, ou do componente logo abaixo
        do header
*/

import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

class Header extends Component{

    render(){
        return(
            <View>                
                <View style={ styles.mainHeader(this.props.color_header) }>  
                    {this.props.children}
                </View>
                <View style={ styles.bottomHeader(this.props.color_header) }>
                    <View style={ styles.innerBottomHeader(this.props.color_content) }></View>
                </View>
            </View>
        )
    }

}

const styles = StyleSheet.create({
    /*
        É possível criar styles como function. Nesses casos é preciso passar o
        argumento da função ao declarar o style no componente. Ex:
            <View style={ styles.mainHeader(this.props.color_header) }>
    */
    mainHeader: color => ({
        backgroundColor: color, 
        height: 180,
        borderBottomEndRadius: 40,  
        justifyContent: 'center',           
    }),

    bottomHeader: color => ({
        backgroundColor: color,
        height: 50,                                 
    }),

    innerBottomHeader: color => ({
        backgroundColor: color,
        height: 50,
        borderTopStartRadius: 40,
    })
})

export default Header 