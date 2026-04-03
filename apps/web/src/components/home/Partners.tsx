
import React from 'react';

const Partners = () => {
  return (
    <section className="py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Our Partners
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto">
              We collaborate with leading organizations to provide accurate and comprehensive data.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 mt-8 w-full opacity-75">
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                AU
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                UNDP
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                UNICEF
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                WHO
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                ILO
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-12 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground font-semibold">
                AfDB
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
