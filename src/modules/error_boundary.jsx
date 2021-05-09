import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error) {  
        return { hasError: true };  
    }
    componentDidCatch(error, errorInfo) {   
        console.log("react error", error, errorInfo);  
    }
    render() {
      if (this.state.hasError) { return (<p>react error</p>); } 
      else {
        return this.props.children; 

      }
    }
  }